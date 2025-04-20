import { useState, useCallback, useEffect } from 'react';
import { callGeminiApi, setProcessingForceStopped } from '../services/geminiService';
import { preloadYouTubeVideo } from '../utils/videoPreloader';
import { generateFileCacheId } from '../utils/cacheUtils';
import { extractYoutubeVideoId } from '../utils/videoDownloader';
import { getVideoDuration, processLongVideo, retrySegmentProcessing } from '../utils/videoProcessor';
import { setCurrentCacheId as setRulesCacheId } from '../utils/transcriptionRulesStore';
import { setCurrentCacheId as setSubtitlesCacheId } from '../utils/userSubtitlesStore';

export const useSubtitles = (t) => {
    const [subtitlesData, setSubtitlesData] = useState(null);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [retryingSegments, setRetryingSegments] = useState([]);

    // Listen for abort events
    useEffect(() => {
        const handleAbort = () => {
            // Reset generating state
            setIsGenerating(false);
            // Reset retrying segments
            setRetryingSegments([]);
            // Update status
            setStatus({ message: t('output.requestsAborted', 'All Gemini requests have been aborted'), type: 'info' });
        };

        // Add event listener
        window.addEventListener('gemini-requests-aborted', handleAbort);

        // Clean up
        return () => {
            window.removeEventListener('gemini-requests-aborted', handleAbort);
        };
    }, [t]);

    // Function to update segment status and dispatch event
    const updateSegmentsStatus = useCallback((segments) => {
        // Dispatch custom event with segment status
        const event = new CustomEvent('segmentStatusUpdate', { detail: segments });
        window.dispatchEvent(event);
    }, []);

    const checkCachedSubtitles = async (cacheId) => {
        try {
            const response = await fetch(`http://localhost:3004/api/subtitle-exists/${cacheId}`);
            const data = await response.json();
            return data.exists ? data.subtitles : null;
        } catch (error) {
            console.error('Error checking subtitle cache:', error);
            return null;
        }
    };

    const saveSubtitlesToCache = async (cacheId, subtitles) => {
        try {
            const response = await fetch('http://localhost:3004/api/save-subtitles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cacheId,
                    subtitles
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save subtitles to cache:', result.error);
            }
        } catch (error) {
            console.error('Error saving subtitles to cache:', error);
        }
    };

    const generateSubtitles = useCallback(async (input, inputType, apiKeysSet, options = {}) => {
        // Extract options
        const { userProvidedSubtitles } = options;
        if (!apiKeysSet.gemini) {
            setStatus({ message: t('errors.apiKeyRequired'), type: 'error' });
            return false;
        }

        // Reset the force stop flag when starting a new generation
        setProcessingForceStopped(false);

        setIsGenerating(true);
        setStatus({ message: t('output.processingVideo'), type: 'loading' });
        setSubtitlesData(null);

        try {
            let cacheId = null;

            if (inputType === 'youtube') {
                cacheId = extractYoutubeVideoId(input);
                preloadYouTubeVideo(input);

                // Set cache ID for both stores
                setRulesCacheId(cacheId);
                setSubtitlesCacheId(cacheId);
                console.log('Set cache ID for YouTube video:', cacheId);
            } else if (inputType === 'file-upload') {
                cacheId = await generateFileCacheId(input);

                // Store the cache ID in localStorage for later use (e.g., saving edited subtitles)
                localStorage.setItem('current_file_cache_id', cacheId);

                // Set cache ID for both stores
                setRulesCacheId(cacheId);
                setSubtitlesCacheId(cacheId);
                console.log('Set cache ID for uploaded file:', cacheId);

                // Check if this is a video file and get its duration
                if (input.type.startsWith('video/')) {
                    try {
                        const duration = await getVideoDuration(input);
                        const durationMinutes = Math.floor(duration / 60);

                        // If video is longer than 30 minutes, show warning and use special processing
                        if (durationMinutes > 30) {
                            setStatus({
                                message: t('output.longVideoWarning', 'You uploaded a {{duration}} minute video. Processing can be longer than usual due to multiple Gemini calls.', { duration: durationMinutes }),
                                type: 'loading'
                            });
                        }
                    } catch (error) {
                        console.warn('Error getting video duration:', error);
                    }
                }
            }

            // Check cache
            if (cacheId) {
                const cachedSubtitles = await checkCachedSubtitles(cacheId);
                if (cachedSubtitles) {
                    setSubtitlesData(cachedSubtitles);
                    setStatus({ message: t('output.subtitlesLoadedFromCache'), type: 'success' });
                    setIsGenerating(false);
                    return true;
                }
            }

            // Generate new subtitles
            let subtitles;

            // Check if this is a long media file (video or audio) that needs special processing
            if (input.type && (input.type.startsWith('video/') || input.type.startsWith('audio/'))) {
                try {
                    const duration = await getVideoDuration(input);
                    const durationMinutes = Math.floor(duration / 60);

                    // Determine if this is a video or audio file
                    const isAudio = input.type.startsWith('audio/');
                    const mediaType = isAudio ? 'audio' : 'video';

                    // Debug log to see the media duration
                    console.log(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} duration: ${duration} seconds, ${durationMinutes} minutes`);

                    // Always use segmentation for media files
                    // Process long media file by splitting it into segments
                    subtitles = await processLongVideo(input, setStatus, t, { userProvidedSubtitles });
                } catch (error) {
                    console.error('Error checking media duration:', error);
                    // Fallback to normal processing
                    subtitles = await callGeminiApi(input, inputType, { userProvidedSubtitles });
                }
            } else {
                // Normal processing for YouTube
                subtitles = await callGeminiApi(input, inputType, { userProvidedSubtitles });
            }

            setSubtitlesData(subtitles);

            // Cache the results
            if (cacheId && subtitles && subtitles.length > 0) {
                await saveSubtitlesToCache(cacheId, subtitles);
            }

            // Check if using a strong model (Gemini 2.5 Pro or Gemini 2.0 Flash Thinking)
            const currentModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
            const strongModels = ['gemini-2.5-pro-exp-03-25', 'gemini-2.0-flash-thinking-exp-01-21'];
            const isUsingStrongModel = strongModels.includes(currentModel);

            // Show different success message based on model
            if (isUsingStrongModel && (!subtitles || subtitles.length === 0)) {
                setStatus({ message: t('output.strongModelSuccess'), type: 'warning' });
            } else {
                setStatus({ message: t('output.generationSuccess'), type: 'success' });
            }
            return true;
        } catch (error) {
            console.error('Error generating subtitles:', error);
            try {
                // Check for specific Gemini API errors
                if (error.message && (
                    (error.message.includes('503') && error.message.includes('Service Unavailable')) ||
                    error.message.includes('The model is overloaded')
                )) {
                    setStatus({ message: t('errors.geminiOverloaded'), type: 'error' });
                } else if (error.message && error.message.includes('token') && error.message.includes('exceeds the maximum')) {
                    setStatus({ message: t('errors.tokenLimitExceeded'), type: 'error' });
                } else if (error.message && error.message.includes('File size') && error.message.includes('exceeds the recommended maximum')) {
                    // Extract file size and max size from error message
                    const sizeMatch = error.message.match(/(\d+)MB\) exceeds the recommended maximum of (\d+)MB/);
                    if (sizeMatch && sizeMatch.length >= 3) {
                        const size = sizeMatch[1];
                        const maxSize = sizeMatch[2];
                        setStatus({
                            message: t('errors.fileSizeTooLarge', 'File size ({{size}}MB) exceeds the recommended maximum of {{maxSize}}MB. Please use a smaller file or lower quality video.', { size, maxSize }),
                            type: 'error'
                        });
                    } else {
                        setStatus({ message: error.message, type: 'error' });
                    }
                } else {
                    const errorData = JSON.parse(error.message);
                    if (errorData.type === 'unrecognized_format') {
                        setStatus({
                            message: `${errorData.message}\n\nRaw text from Gemini:\n${errorData.rawText}`,
                            type: 'error'
                        });
                    } else {
                        setStatus({ message: `Error: ${error.message}`, type: 'error' });
                    }
                }
            } catch {
                // Check for specific Gemini API errors in the catch block too
                if (error.message && (
                    (error.message.includes('503') && error.message.includes('Service Unavailable')) ||
                    error.message.includes('The model is overloaded')
                )) {
                    setStatus({ message: t('errors.geminiOverloaded'), type: 'error' });
                } else if (error.message && error.message.includes('token') && error.message.includes('exceeds the maximum')) {
                    setStatus({ message: t('errors.tokenLimitExceeded'), type: 'error' });
                } else if (error.message && error.message.includes('File size') && error.message.includes('exceeds the recommended maximum')) {
                    // Extract file size and max size from error message
                    const sizeMatch = error.message.match(/(\d+)MB\) exceeds the recommended maximum of (\d+)MB/);
                    if (sizeMatch && sizeMatch.length >= 3) {
                        const size = sizeMatch[1];
                        const maxSize = sizeMatch[2];
                        setStatus({
                            message: t('errors.fileSizeTooLarge', 'File size ({{size}}MB) exceeds the recommended maximum of {{maxSize}}MB. Please use a smaller file or lower quality video.', { size, maxSize }),
                            type: 'error'
                        });
                    } else {
                        setStatus({ message: error.message, type: 'error' });
                    }
                } else {
                    setStatus({ message: `Error: ${error.message}`, type: 'error' });
                }
            }
            return false;
        } finally {
            setIsGenerating(false);
        }
    }, [t]);

    const retryGeneration = useCallback(async (input, inputType, apiKeysSet, options = {}) => {
        // Extract options
        const { userProvidedSubtitles } = options;
        if (!apiKeysSet.gemini) {
            setStatus({ message: t('errors.apiKeyRequired'), type: 'error' });
            return false;
        }

        // Reset the force stop flag when retrying generation
        setProcessingForceStopped(false);

        setIsGenerating(true);
        setStatus({ message: 'Retrying request to Gemini. This may take a few minutes...', type: 'loading' });

        try {
            let subtitles;

            // Check if this is a long media file (video or audio) that needs special processing
            if (input.type && (input.type.startsWith('video/') || input.type.startsWith('audio/'))) {
                try {
                    const duration = await getVideoDuration(input);
                    const durationMinutes = Math.floor(duration / 60);

                    // Determine if this is a video or audio file
                    const isAudio = input.type.startsWith('audio/');
                    const mediaType = isAudio ? 'audio' : 'video';

                    // Debug log to see the media duration
                    console.log(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} duration: ${duration} seconds, ${durationMinutes} minutes`);

                    // Always use segmentation for media files to match generateSubtitles behavior
                    // Process long media file by splitting it into segments
                    subtitles = await processLongVideo(input, setStatus, t, { userProvidedSubtitles });
                } catch (error) {
                    console.error('Error checking media duration:', error);
                    // Fallback to normal processing
                    subtitles = await callGeminiApi(input, inputType, { userProvidedSubtitles });
                }
            } else {
                // Normal processing for YouTube
                subtitles = await callGeminiApi(input, inputType, { userProvidedSubtitles });
            }

            setSubtitlesData(subtitles);

            // Cache the new results
            if (inputType === 'youtube') {
                const cacheId = extractYoutubeVideoId(input);
                if (cacheId && subtitles && subtitles.length > 0) {
                    await saveSubtitlesToCache(cacheId, subtitles);
                }

                // Set cache ID for both stores
                setRulesCacheId(cacheId);
                setSubtitlesCacheId(cacheId);
                console.log('Set cache ID for YouTube video (retry):', cacheId);
            } else if (inputType === 'file-upload') {
                // For file uploads, generate and store the cache ID
                const cacheId = await generateFileCacheId(input);
                localStorage.setItem('current_file_cache_id', cacheId);

                if (cacheId && subtitles && subtitles.length > 0) {
                    await saveSubtitlesToCache(cacheId, subtitles);
                }

                // Set cache ID for both stores
                setRulesCacheId(cacheId);
                setSubtitlesCacheId(cacheId);
                console.log('Set cache ID for uploaded file (retry):', cacheId);
            }

            // Check if using a strong model (Gemini 2.5 Pro or Gemini 2.0 Flash Thinking)
            const currentModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
            const strongModels = ['gemini-2.5-pro-exp-03-25', 'gemini-2.0-flash-thinking-exp-01-21'];
            const isUsingStrongModel = strongModels.includes(currentModel);

            // Show different success message based on model
            if (isUsingStrongModel && (!subtitles || subtitles.length === 0)) {
                setStatus({ message: t('output.strongModelSuccess'), type: 'warning' });
            } else {
                setStatus({ message: t('output.generationSuccess'), type: 'success' });
            }
            return true;
        } catch (error) {
            console.error('Error regenerating subtitles:', error);

            // Check for specific Gemini API errors
            if (error.message && (
                (error.message.includes('503') && error.message.includes('Service Unavailable')) ||
                error.message.includes('The model is overloaded')
            )) {
                setStatus({ message: t('errors.geminiOverloaded'), type: 'error' });
            } else if (error.message && error.message.includes('token') && error.message.includes('exceeds the maximum')) {
                setStatus({ message: t('errors.tokenLimitExceeded'), type: 'error' });
            } else if (error.message && error.message.includes('File size') && error.message.includes('exceeds the recommended maximum')) {
                // Extract file size and max size from error message
                const sizeMatch = error.message.match(/(\d+)MB\) exceeds the recommended maximum of (\d+)MB/);
                if (sizeMatch && sizeMatch.length >= 3) {
                    const size = sizeMatch[1];
                    const maxSize = sizeMatch[2];
                    setStatus({
                        message: t('errors.fileSizeTooLarge', 'File size ({{size}}MB) exceeds the recommended maximum of {{maxSize}}MB. Please use a smaller file or lower quality video.', { size, maxSize }),
                        type: 'error'
                    });
                } else {
                    setStatus({ message: error.message, type: 'error' });
                }
            } else {
                setStatus({ message: `Error: ${error.message}`, type: 'error' });
            }
            return false;
        } finally {
            setIsGenerating(false);
        }
    }, [t]);

    // State to track which segments are currently being retried is defined at the top of the hook

    // Function to retry a specific segment
    const retrySegment = useCallback(async (segmentIndex, segments, options = {}) => {
        // Extract options
        const { userProvidedSubtitles, modelId } = options;
        // Initialize subtitlesData to empty array if it's null
        // This happens when using the strong model where we process segments one by one
        const currentSubtitles = subtitlesData || [];

        // Reset the force stop flag when retrying a segment
        setProcessingForceStopped(false);

        // Determine if this is a video or audio file based on the segment name
        // Segment names for audio files typically include 'audio' in the name
        const isAudio = segments && segments[segmentIndex] &&
            (segments[segmentIndex].name?.toLowerCase().includes('audio') ||
             segments[segmentIndex].url?.toLowerCase().includes('audio'));
        const mediaType = isAudio ? 'audio' : 'video';
        console.log(`Retrying segment ${segmentIndex} with mediaType: ${mediaType}`);

        // Mark this segment as retrying
        setRetryingSegments(prev => [...prev, segmentIndex]);

        // Update the segment status to show it's retrying
        const retryingStatus = {
            index: segmentIndex,
            status: 'retrying',
            message: t('output.retryingSegment', 'Retrying segment...'),
            shortMessage: t('output.retrying', 'Retrying...')
        };
        const event = new CustomEvent('segmentStatusUpdate', { detail: [retryingStatus] });
        window.dispatchEvent(event);

        // Save the current model if we're using a different one for this retry
        let currentModel = null;
        if (modelId) {
            console.log(`Using model ${modelId} for segment ${segmentIndex} retry`);
            currentModel = localStorage.getItem('gemini_model');
            localStorage.setItem('gemini_model', modelId);
        }

        try {
            // Retry processing the specific segment
            const updatedSubtitles = await retrySegmentProcessing(
                segmentIndex,
                segments,
                currentSubtitles,
                (status) => {
                    // Only update the overall status if it's a success message
                    if (status.type === 'success') {
                        setStatus(status);
                    }
                },
                t,
                mediaType,
                { userProvidedSubtitles, modelId }
            );

            // Update the subtitles data with the new results
            setSubtitlesData(updatedSubtitles);

            // Show a brief success message
            // Check if we're generating a new segment or retrying an existing one
            const isGenerating = !subtitlesData || subtitlesData.length === 0;
            setStatus({
                message: isGenerating
                    ? t('output.segmentGenerateSuccess', 'Segment {{segmentNumber}} processed successfully and combined with existing subtitles', { segmentNumber: segmentIndex + 1 })
                    : t('output.segmentRetrySuccess', 'Segment {{segmentNumber}} reprocessed successfully', { segmentNumber: segmentIndex + 1 }),
                type: 'success'
            });
            return true;
        } catch (error) {
            console.error('Error retrying segment:', error);

            // Update the segment status to show the error
            const errorStatus = {
                index: segmentIndex,
                status: 'error',
                message: error.message || t('output.processingFailed', 'Processing failed'),
                shortMessage: t('output.failed', 'Failed')
            };
            const errorEvent = new CustomEvent('segmentStatusUpdate', { detail: [errorStatus] });
            window.dispatchEvent(errorEvent);

            // Show error message
            setStatus({
                message: `${t('errors.segmentRetryFailed', 'Failed to retry segment {{segmentNumber}}', { segmentNumber: segmentIndex + 1 })}: ${error.message}`,
                type: 'error'
            });
            return false;
        } finally {
            // Remove this segment from the retrying list
            setRetryingSegments(prev => prev.filter(idx => idx !== segmentIndex));

            // Restore the original model if we changed it
            if (modelId && currentModel) {
                console.log(`Restoring original model ${currentModel} after segment ${segmentIndex} retry`);
                localStorage.setItem('gemini_model', currentModel);
            }
        }
    }, [subtitlesData, t]);

    return {
        subtitlesData,
        setSubtitlesData,
        status,
        setStatus,
        isGenerating,
        generateSubtitles,
        retryGeneration,
        updateSegmentsStatus,
        retrySegment,
        retryingSegments
    };
};