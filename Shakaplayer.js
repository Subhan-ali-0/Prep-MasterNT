'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShakaPlayer({ url, title = 'Video', onClose }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setError('');

        const shaka = await import('shaka-player/dist/shaka-player.compiled.js');

        if (cancelled || !videoRef.current) return;

        shaka.default.polyfill();

        if (!shaka.default.Player.isBrowserSupported()) {
          throw new Error('Shaka Player browser me supported nahi hai.');
        }

        const player = new shaka.default.Player(videoRef.current);

        playerRef.current = player;

        player.addEventListener('error', (event) => {
          console.error('Shaka error:', event.detail);
          setError(
            event.detail?.message ||
            `Video playback error (${event.detail?.code || 'unknown'})`
          );
        });

        await player.load(url);

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Shaka Player:', err);

        if (!cancelled) {
          setLoading(false);
          setError(err?.message || 'Video load nahi ho saka.');
        }
      }
    }

    if (url) {
      init();
    }

    return () => {
      cancelled = true;

      if (playerRef.current) {
        playerRef.current.destroy().catch(() => {});
        playerRef.current = null;
      }
    };
  }, [url]);

  return (
    <div className="pm-video-player">
      <div className="pm-video-header">
        <button onClick={onClose}>←</button>

        <div className="pm-video-title">
          {title}
        </div>
      </div>

      <div className="pm-video-container">
        {loading && (
          <div className="pm-video-loading">
            Loading video...
          </div>
        )}

        {error && (
          <div className="pm-video-error">
            {error}
          </div>
        )}

        <video
          ref={videoRef}
          className="pm-video-element"
          controls
          playsInline
        />
      </div>
    </div>
  );
}
