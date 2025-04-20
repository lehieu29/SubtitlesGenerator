import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModelDropdown from './ModelDropdown';
import PromptEditor from './PromptEditor';
// Import default prompts from geminiService if needed in the future
// import { getDefaultConsolidatePrompt, getDefaultSummarizePrompt } from '../services/geminiService';
import '../styles/DownloadOptionsModal.css';

/**
 * Modal component for download and processing options
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onDownload - Function to handle download
 * @param {Function} props.onProcess - Function to handle processing (consolidate/summarize)
 * @param {boolean} props.hasTranslation - Whether translation is available
 * @param {boolean} props.hasOriginal - Whether original subtitles are available
 * @returns {JSX.Element} - Rendered component
 */
const DownloadOptionsModal = ({
  isOpen,
  onClose,
  onDownload,
  onProcess,
  hasTranslation = false,
  hasOriginal = true
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // State for selected options
  const [subtitleSource, setSubtitleSource] = useState('original');
  const [fileFormat, setFileFormat] = useState('srt');
  const [processType, setProcessType] = useState(null); // Initialize to null so only Download Files tab is active
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
  });
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [customPrompts, setCustomPrompts] = useState({
    consolidate: localStorage.getItem('custom_prompt_consolidate') || null,
    summarize: localStorage.getItem('custom_prompt_summarize') || null
  });
  const [splitDuration, setSplitDuration] = useState(() => {
    // Get the split duration from localStorage or use default (0 = no split)
    return parseInt(localStorage.getItem('consolidation_split_duration') || '0');
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to default state with only Download Files tab active
      setSubtitleSource('original');
      setFileFormat('srt');
      setProcessType(null);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Handle download button click
  const handleDownload = () => {
    onDownload(subtitleSource, fileFormat);
    onClose();
  };

  // Handle process button click
  const handleProcess = () => {
    // Pass the custom prompt if available
    const customPrompt = customPrompts[processType];
    // Pass the split duration for consolidation
    onProcess(subtitleSource, processType, selectedModel, splitDuration, customPrompt);
    onClose();
  };

  // Handle saving custom prompt
  const handleSavePrompt = (newPrompt) => {
    const updatedPrompts = {
      ...customPrompts,
      [processType]: newPrompt
    };
    setCustomPrompts(updatedPrompts);
    localStorage.setItem(`custom_prompt_${processType}`, newPrompt);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="download-options-modal" ref={modalRef}>
        <div className="modal-header">
          <h3>{t('download.options', 'Download & Process Options')}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Subtitle source selection */}
          <div className="option-group">
            <h4>{t('download.subtitleSource', 'Subtitle Source')}</h4>
            <div className="radio-group">
              <label className={`radio-option ${!hasOriginal ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="subtitle-source"
                  value="original"
                  checked={subtitleSource === 'original'}
                  onChange={() => setSubtitleSource('original')}
                  disabled={!hasOriginal}
                />
                <span>{t('download.original', 'Original')}</span>
              </label>
              <label className={`radio-option ${!hasTranslation ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="subtitle-source"
                  value="translated"
                  checked={subtitleSource === 'translated'}
                  onChange={() => setSubtitleSource('translated')}
                  disabled={!hasTranslation}
                />
                <span>{t('download.translated', 'Translated')}</span>
              </label>
            </div>
          </div>

          {/* Action tabs */}
          <div className="tabs">
            <div
              className={`tab ${processType === null ? 'active' : ''}`}
              onClick={() => {
                setFileFormat('srt');
                setProcessType(null);
              }}
            >
              {t('download.downloadFiles', 'Download Files')}
            </div>
            <div
              className={`tab ${processType !== null ? 'active' : ''}`}
              onClick={() => {
                setFileFormat(null);
                setProcessType('consolidate');
              }}
            >
              {t('download.processText', 'Process Text')}
            </div>
          </div>

          {/* File format options */}
          {fileFormat && (
            <div className="option-group">
              <h4>{t('download.fileFormat', 'File Format')}</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="file-format"
                    value="srt"
                    checked={fileFormat === 'srt'}
                    onChange={() => setFileFormat('srt')}
                  />
                  <span>SRT</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="file-format"
                    value="json"
                    checked={fileFormat === 'json'}
                    onChange={() => setFileFormat('json')}
                  />
                  <span>JSON</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="file-format"
                    value="txt"
                    checked={fileFormat === 'txt'}
                    onChange={() => setFileFormat('txt')}
                  />
                  <span>{t('download.txtNoTimings', 'TXT (no timings)')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Process options */}
          {processType && (
            <>
              <div className="option-group">
                <h4>{t('download.processType', 'Process Type')}</h4>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="process-type"
                      value="consolidate"
                      checked={processType === 'consolidate'}
                      onChange={() => {
                        setProcessType('consolidate');
                        // Close prompt editor if open to ensure correct prompt is loaded when reopened
                        if (isPromptEditorOpen) setIsPromptEditorOpen(false);
                      }}
                    />
                    <span>{t('download.consolidate', 'Complete Document (TXT)')}</span>
                    <div className="info-icon-container" title={t('download.consolidateExplanation', 'Converts subtitles into a coherent document, improving flow and readability while maintaining the original meaning.')}>
                      <svg className="info-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </div>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="process-type"
                      value="summarize"
                      checked={processType === 'summarize'}
                      onChange={() => {
                        setProcessType('summarize');
                        // Close prompt editor if open to ensure correct prompt is loaded when reopened
                        if (isPromptEditorOpen) setIsPromptEditorOpen(false);
                      }}
                    />
                    <span>{t('download.summarize', 'Summarize (TXT)')}</span>
                    <div className="info-icon-container" title={t('download.summarizeExplanation', 'Creates a concise summary of the main points and key information, about 1/3 the length of the original text.')}>
                      <svg className="info-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                    </div>
                  </label>
                </div>
              </div>

              {/* Split Duration Selection (only for consolidate) */}
              {processType === 'consolidate' && (
                <div className="option-group">
                  <h4>{t('consolidation.splitDuration', 'Split Duration')}:</h4>
                  <select
                    value={splitDuration}
                    onChange={(e) => setSplitDuration(parseInt(e.target.value))}
                    className="split-duration-select"
                    title={t('consolidation.splitDurationTooltip', 'Split text into chunks for processing to avoid token limits')}
                  >
                    <option value="0">{t('consolidation.noSplit', 'No Split')}</option>
                    <option value="1">1 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="3">3 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="5">5 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="7">7 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="10">10 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="15">15 {t('consolidation.minutes', 'minutes')}</option>
                    <option value="20">20 {t('consolidation.minutes', 'minutes')}</option>
                  </select>
                  <div className="setting-description">
                    {t('consolidation.splitDurationHelp', 'Splitting text into smaller chunks helps prevent processing from being cut off due to token limits. For longer texts, use smaller chunks.')}
                  </div>
                </div>
              )}

              <div className="option-group">
                <div className="option-header">
                  <h4>{t('download.selectModel', 'Select Model')}</h4>
                  <button
                    className="edit-prompt-button-with-text"
                    onClick={() => setIsPromptEditorOpen(true)}
                    title={t('promptEditor.editPromptTooltip', 'Edit Gemini prompt')}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    <span>{t('promptEditor.editPrompt', 'Edit Prompt')}</span>
                  </button>
                </div>
                <ModelDropdown
                  onModelSelect={(modelId) => setSelectedModel(modelId)}
                  selectedModel={selectedModel}
                  buttonClassName="modal-model-dropdown"
                  headerText={t('download.selectModelForProcessing', 'Select model for processing')}
                />
              </div>

              {/* Prompt Editor */}
              <PromptEditor
                key={`prompt-editor-${processType}`} // Add key to force re-render when processType changes
                isOpen={isPromptEditorOpen}
                onClose={() => setIsPromptEditorOpen(false)}
                initialPrompt={
                  customPrompts[processType] ||
                  (processType === 'consolidate'
                    ? `I have a collection of subtitles from a video or audio. Please convert these into a coherent document.

Here are the subtitles:\n\n{subtitlesText}`
                    : `I have a collection of subtitles from a video or audio. Please create a concise summary.

Here are the subtitles:\n\n{subtitlesText}`)
                }
                onSave={handleSavePrompt}
                title={
                  processType === 'consolidate'
                    ? t('promptEditor.editConsolidatePrompt', 'Edit Consolidation Prompt')
                    : t('promptEditor.editSummarizePrompt', 'Edit Summarization Prompt')
                }
                promptType={processType} // Explicitly set the prompt type
                description={t('promptEditor.customizePromptDesc', 'Add custom instructions for processing. The system will automatically handle formatting.')}
              />
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </button>
          {fileFormat && (
            <button className="action-button download-button" onClick={handleDownload}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {t('download.download', 'Download')}
            </button>
          )}
          {/* Process button */}
          {processType && (
            <button className="action-button process-button" onClick={handleProcess}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
              {t('download.process', 'Process')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadOptionsModal;
