'use client';

import { useEffect, useRef, useState } from 'react';

export default function PdfPlayer({ url, title, onClose }) {
  const canvasRef = useRef(null);
  const pdfjsRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError('');

        // pdfjs-dist is loaded only in the browser.
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        pdfjsRef.current = pdfjsLib;

        const task = pdfjsLib.getDocument({
          url,
          withCredentials: false,
        });

        const document = await task.promise;

        if (cancelled) return;

        setPdf(document);
        setPages(document.numPages);
        setPage(1);
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError('PDF load nahi ho saka.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (url) {
      loadPdf();
    }

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      try {
        const currentPage = await pdf.getPage(page);

        if (cancelled) return;

        const viewport = currentPage.getViewport({
          scale,
        });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await currentPage.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch (err) {
        console.error(err);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdf, page, scale]);

  return (
    <div className="pm-pdf-player">

      <div className="pm-pdf-header">
        <button onClick={onClose}>
          ←
        </button>

        <div className="pm-pdf-title">
          {title || 'PDF Viewer'}
        </div>
      </div>

      <div className="pm-pdf-toolbar">

        <button
          onClick={() =>
            setPage((p) => Math.max(1, p - 1))
          }
          disabled={page <= 1}
        >
          ◀
        </button>

        <span>
          {page} / {pages || '—'}
        </span>

        <button
          onClick={() =>
            setPage((p) =>
              Math.min(pages, p + 1)
            )
          }
          disabled={page >= pages}
        >
          ▶
        </button>

        <button
          onClick={() =>
            setScale((s) =>
              Math.max(0.6, s - 0.2)
            )
          }
        >
          −
        </button>

        <button
          onClick={() =>
            setScale((s) =>
              Math.min(3, s + 0.2)
            )
          }
        >
          +
        </button>

      </div>

      <div className="pm-pdf-content">

        {loading && (
          <div className="pm-pdf-loading">
            Loading PDF...
          </div>
        )}

        {error && (
          <div className="pm-pdf-error">
            {error}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="pm-pdf-canvas"
        />

      </div>

    </div>
  );
}
