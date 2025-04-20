import React from 'react';
import { useTranslation } from 'react-i18next';
import ModelDropdown from '../ModelDropdown';

/**
 * Model selection component
 * @param {Object} props - Component props
 * @param {string} props.selectedModel - Currently selected model
 * @param {Function} props.onModelSelect - Function to handle model selection
 * @returns {JSX.Element} - Rendered component
 */
const ModelSelection = ({ selectedModel, onModelSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="translation-row model-row">
      <div className="row-label">
        <label>{t('translation.modelSelection', 'Model')}:</label>
      </div>
      <div className="row-content">
        <ModelDropdown
          onModelSelect={onModelSelect}
          selectedModel={selectedModel}
          buttonClassName="translate-model-dropdown"
          headerText={t('translation.selectModel', 'Select model for translation')}
        />
      </div>
    </div>
  );
};

export default ModelSelection;
