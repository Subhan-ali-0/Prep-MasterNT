'use client';

import { useState } from 'react';

export default function PdfPlayer({
  url,
  title = 'PDF Viewer',
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function openPdf() {
    if (!url) return;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <div className="pm-pdf-player">
      <div className="pm-pdf-header">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close PDF"
        >
          ←
        </button>

        <div className="pm-pdf-title">
          {title}
        </div>

        <button
          type="button"
          className="pm-pdf-open"
          onClick={openPdf}
        >
          Open PDF
        </button>
      </div>

      <div className="pm-pdf-content">
        {loading && !error && (
          <div className="pm-pdf-loading">
            <div className="pm-pdf-spinner">
              ⏳
            </div>

            <div>Loading PDF...</div>
          </div>
        )}

        {error ? (
          <div className="pm-pdf-error">
            <div className="pm-pdf-error-icon">
              📄
            </div>

            <h3>PDF viewer couldn't load this file</h3>

            <p>
              Browser me PDF directly open karke
              dekhein.
            </p>

            <button
              type="button"
              className="pm-primary"
              onClick={openPdf}
            >
              Open PDF
            </button>
          </div>
        ) : (
          <iframe
            src={url}
            title={title}
            className="pm-pdf-frame"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
