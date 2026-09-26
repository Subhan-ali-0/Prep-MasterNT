'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShakaPlayer({
  url,
  title = 'Video',
  onClose,
}) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function initPlayer() {
      try {
        setLoading(true);
        setError('');

        if (!url) {
          throw new Error('Video URL available nahi hai.');
        }

        console.log('🎬 Shaka loading URL:', url);

        const shakaModule = await import(
          'shaka-player/dist/shaka-player.compiled.js'
        );

        const shaka =
          shakaModule.default ?? shakaModule;

        if (cancelled) return;

        shaka.polyfill();

        if (!shaka.Player.isBrowserSupported()) {
          throw new Error(
            'Shaka Player is browser me supported nahi hai.'
          );
        }

        if (!videoRef.current) {
          throw new Error(
            'Video element unavailable.'
          );
        }

        const player = new shaka.Player(
          videoRef.current
        );

        playerRef.current = player;

        // Full Shaka error
        player.addEventListener(
          'error',
          (event) => {
            const detail = event?.detail;

            console.error(
              '========== SHAKA ERROR =========='
            );

            console.error(
              'Full error:',
              detail
            );

            console.error(
              'Code:',
              detail?.code
            );

            console.error(
              'Category:',
              detail?.category
            );

            console.error(
              'Severity:',
              detail?.severity
            );

            console.error(
              'Data:',
              detail?.data
            );

            console.error(
              'Data JSON:',
              JSON.stringify(
                detail?.data ?? []
              )
            );

            console.error(
              '=================================='
            );

            if (!cancelled) {
              const code =
                detail?.code ?? 'unknown';

              const category =
                detail?.category ?? 'unknown';

              const severity =
                detail?.severity ?? 'unknown';

              const data =
                detail?.data ?? [];

              setError(
                `Shaka Error ${code} | Category ${category} | Severity ${severity} | Data: ${JSON.stringify(data)}`
              );

              setLoading(false);
            }
          }
        );

        await player.load(url);

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error(
          'Shaka Player initialization error:',
          err
        );

        if (!cancelled) {
          setLoading(false);

          setError(
            err?.message ||
              'Video load nahi ho saka.'
          );
        }
      }
    }

    initPlayer();

    return () => {
      cancelled = true;

      const player = playerRef.current;

      playerRef.current = null;

      if (player) {
        player
          .destroy()
          .catch((err) => {
            console.error(
              'Shaka destroy error:',
              err
            );
          });
      }
    };
  }, [url]);

  return (
    <div className="pm-video-player">
      <div className="pm-video-header">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
        >
          ←
        </button>

        <div className="pm-video-title">
          {title}
        </div>
      </div>

      <div className="pm-video-container">
        {loading && (
          <div className="pm-video-loading">
            <div>🎥</div>
            <span>
              Loading video...
            </span>
          </div>
        )}

        {error && (
          <div className="pm-video-error">
            <div className="pm-video-error-icon">
              ⚠️
            </div>

            <h3>
              Unable to play video
            </h3>

            <p>{error}</p>
          </div>
        )}

        <video
          ref={videoRef}
          className="pm-video-element"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    </div>
  );
}
