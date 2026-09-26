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
          throw new Error(
            'Video URL available nahi hai.'
          );
        }

        const shakaModule = await import(
          'shaka-player/dist/shaka-player.compiled.js'
        );

        const shaka =
          shakaModule.default ??
          shakaModule;

        if (cancelled) return;

        shaka.polyfill();

        if (
          !shaka.Player.isBrowserSupported()
        ) {
          throw new Error(
            'Shaka Player is browser me supported nahi hai.'
          );
        }

        if (!videoRef.current) {
          throw new Error(
            'Video element unavailable.'
          );
        }

        const player =
          new shaka.Player(
            videoRef.current
          );

        playerRef.current = player;

        player.addEventListener(
          'error',
          (event) => {
            const detail = event?.detail;

            console.error(
              'Shaka Player error:',
              detail
            );

            const code =
              detail?.code ??
              'unknown';

            const message =
              detail?.message ||
              `Video playback error (${code})`;

            if (!cancelled) {
              setError(message);
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

            <button
              type="button"
              className="pm-secondary"
              onClick={() =>
                window.open(
                  url,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              Open Video
            </button>
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
