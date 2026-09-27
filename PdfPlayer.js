'use client';

export default function PdfPlayer({
  url,
  title = 'PDF',
  onClose,
}) {
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
        {url ? (
          <iframe
            src={url}
            title={title}
            className="pm-pdf-frame"
          />
        ) : (
          <div className="pm-pdf-error">
            <div className="pm-pdf-error-icon">
              📄
            </div>

            <h3>PDF available nahi hai</h3>

            <p>
              Is note ke liye PDF URL nahi mila.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
