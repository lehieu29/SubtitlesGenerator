import React from 'react';

/**
 * Translation error component
 * @param {Object} props - Component props
 * @param {string} props.error - Error message
 * @returns {JSX.Element|null} - Rendered component or null if no error
 */
const TranslationError = ({ error }) => {
  if (!error) return null;

  return (
    <div className="translation-row error-row">
      <div className="row-content">
        <div className="translation-error">{error}</div>
      </div>
    </div>
  );
};

export default TranslationError;
