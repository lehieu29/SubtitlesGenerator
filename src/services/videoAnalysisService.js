/**
 * Service for analyzing videos with Gemini before splitting
 */

import { fileToBase64 } from '../utils/fileUtils';
import { createVideoAnalysisSchema, addResponseSchema } from '../utils/schemaUtils';
import i18n from '../i18n/i18n';

// Translation function shorthand
const t = (key, fallback) => i18n.t(key, fallback);

// Store the active abort controller for video analysis
let activeAnalysisController = null;

// Maximum number of terminology items to keep to prevent localStorage overflow
const MAX_TERMINOLOGY_ITEMS = 50;

/**
 * Abort any active video analysis request
 */
export const abortVideoAnalysis = () => {
  if (activeAnalysisController) {
    console.log('Aborting active video analysis request');
    activeAnalysisController.abort();
    activeAnalysisController = null;
    return true;
  }
  return false;
};

/**
 * Sanitize and limit the size of the analysis result to prevent localStorage overflow
 * @param {Object} analysisResult - The raw analysis result from Gemini
 * @returns {Object} - The sanitized analysis result
 */
const sanitizeAnalysisResult = (analysisResult) => {
  if (!analysisResult) return null;

  try {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(analysisResult));

    // Ensure we have the required structure
    if (!sanitized.recommendedPreset) {
      sanitized.recommendedPreset = {
        id: 'general',
        reason: 'Default preset selected due to missing recommendation'
      };
    }

    if (!sanitized.transcriptionRules) {
      sanitized.transcriptionRules = {};
    }

    // Limit terminology items if there are too many
    if (sanitized.transcriptionRules.terminology &&
        Array.isArray(sanitized.transcriptionRules.terminology) &&
        sanitized.transcriptionRules.terminology.length > MAX_TERMINOLOGY_ITEMS) {
      console.log(`Limiting terminology items from ${sanitized.transcriptionRules.terminology.length} to ${MAX_TERMINOLOGY_ITEMS}`);
      sanitized.transcriptionRules.terminology = sanitized.transcriptionRules.terminology.slice(0, MAX_TERMINOLOGY_ITEMS);

      // Add a note about truncation
      if (!sanitized.transcriptionRules.additionalNotes) {
        sanitized.transcriptionRules.additionalNotes = [];
      }
      sanitized.transcriptionRules.additionalNotes.push(
        `Note: The terminology list was truncated from the original analysis as it was too large.`
      );
    }

    return sanitized;
  } catch (error) {
    console.error('Error sanitizing analysis result:', error);
    return {
      recommendedPreset: {
        id: 'general',
        reason: 'Default preset selected due to sanitization error'
      },
      transcriptionRules: {
        additionalNotes: ['Error sanitizing analysis result. Using default settings.']
      }
    };
  }
};

/**
 * Analyzes a video with Gemini to determine the best prompt preset and generate transcription rules
 * @param {File} videoFile - The video file to analyze
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeVideoWithGemini = async (videoFile, onStatusUpdate) => {
  // Create a new AbortController and store it
  activeAnalysisController = new AbortController();
  const signal = activeAnalysisController.signal;
  try {
    const geminiApiKey = localStorage.getItem('gemini_api_key');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found');
    }

    // Get the selected model from localStorage or use the default
    const MODEL = localStorage.getItem('video_analysis_model') || "gemini-2.0-flash";

    // Get video duration
    onStatusUpdate({ message: t('input.preparingVideoAnalysis', 'Preparing video for analysis...'), type: 'loading' });
    let videoDuration = 0;
    try {
      // Import dynamically to avoid circular dependencies
      const { getVideoDuration } = await import('../utils/durationUtils');
      videoDuration = await getVideoDuration(videoFile);
      console.log(`Video duration for analysis: ${videoDuration} seconds`);
    } catch (error) {
      console.warn('Could not determine video duration:', error);
    }

    // Convert the video file to base64
    const base64Data = await fileToBase64(videoFile);

    // Determine how comprehensive the rule set should be based on video length
    const isLongVideo = videoDuration > 600; // More than 10 minutes
    const isVeryLongVideo = videoDuration > 1800; // More than 30 minutes

    // Create the request data with the analysis prompt
    const analysisPrompt = `You are an expert video and audio content analyzer. This video is ${Math.round(videoDuration)} seconds long (${Math.round(videoDuration/60)} minutes). Analyze this video and provide:

1. The most suitable transcription preset for this content from the following options:
   - general: General purpose transcription
   - focus-spoken-words: Focus on spoken words (for interviews, podcasts, etc.)
   - focus-lyrics: Focus on lyrics (for music videos, songs)
   - extract-text: Extract visible text (for presentations, tutorials with text)
   - describe-video: Describe video content (for visual content description)
   - diarize-speakers: Identify different speakers (for multi-person conversations)
   - chaptering: Create chapters based on content (for long-form content)

2. A detailed rule set for consistent transcription. ${isLongVideo ? 'Since this is a longer video, provide as many detailed rules as possible to ensure consistency across the entire transcription.' : ''} ${isVeryLongVideo ? 'This is a very long video, so an extremely comprehensive rule set is essential - aim for at least 5-10 items in each applicable category.' : ''} Include (only if applicable):
   - Atmosphere: Description of the setting or context
   - Terminology: List of specialized terms and proper nouns with definitions (${isLongVideo ? 'provide as many as you can identify' : 'provide key terms'})
   - Speaker Identification: Descriptions of different speakers (${isLongVideo ? 'be very detailed about voice characteristics, speaking patterns, and any identifying features' : 'basic identification'})
   - Formatting and Style Conventions: How to format specific content (${isLongVideo ? 'be comprehensive and specific' : 'basic guidelines'})
   - Spelling, Grammar, and Punctuation: Special rules for this content (${isLongVideo ? 'include all exceptions and special cases' : 'key rules only'})
   - Relationships and Social Hierarchy: Information about relationships between people
   - Any other aspects that would help ensure consistent, high-quality transcription

Provide your analysis in a structured format that can be used to guide the transcription process.`;

    // Create the request data
    let requestData = {
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: videoFile.type,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    // Add response schema for structured output
    requestData = addResponseSchema(requestData, createVideoAnalysisSchema());

    onStatusUpdate({ message: t('input.analyzingVideo', 'Analyzing video content...'), type: 'loading' });

    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: signal // Add the abort signal
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Check if this is a structured JSON response
    let analysisResult;
    if (data.candidates[0]?.content?.parts[0]?.structuredJson) {
      console.log('Received structured JSON analysis response');
      analysisResult = data.candidates[0].content.parts[0].structuredJson;
    } else {
      // If not structured, try to parse the text response
      const resultText = data.candidates[0]?.content?.parts[0]?.text;
      if (!resultText) {
        throw new Error('No analysis returned from Gemini');
      }

      // Try to parse the text as JSON
      try {
        analysisResult = JSON.parse(resultText);
      } catch (e) {
        console.error('Failed to parse analysis as JSON:', e);
        // Create a simplified object with the raw text
        analysisResult = {
          rawResponse: resultText.substring(0, 1000), // Limit the size of raw response
          recommendedPreset: {
            id: 'general',
            reason: 'Default preset selected due to parsing error'
          },
          transcriptionRules: {
            additionalNotes: [resultText.substring(0, 1000) + '... (truncated)']
          }
        };
      }
    }

    // Sanitize the result to prevent localStorage overflow
    const sanitizedResult = sanitizeAnalysisResult(analysisResult);
    console.log('Sanitized analysis result:', sanitizedResult);

    return sanitizedResult;
  } catch (error) {
    console.error('Error analyzing video:', error);

    // Clear the active controller
    activeAnalysisController = null;

    // Check if this is an abort error
    if (error.name === 'AbortError') {
      throw new Error('Video analysis was cancelled');
    }

    throw error;
  } finally {
    // Clear the active controller in case of success
    activeAnalysisController = null;
  }
};
