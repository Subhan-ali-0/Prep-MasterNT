'use client';

import { useEffect, useRef, useState } from 'react';

export default function HlsVideo({
  src,
  url,
  title,
  className = 'pm-video',
  onFatalError,
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const videoUrl = src || url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    let player;
    let cancelled = false;

    const showError = (message) => {
      if (cancelled) return;

      setStatus('error');
      setError(message);
      onFatalError?.(message);
    };

    async function setupPlayer() {
      try {
        setStatus('loading');
        setError('');

        const shaka = await import('shaka-player');

        if (cancelled) return;

        shaka.default.polyfill.installAll();

        if (!shaka.default.Player.isBrowserSupported()) {
          showError('Is browser mein Shaka Player supported nahi hai.');
          return;
        }

        player = new shaka.default.Player();
        await player.attach(video);

        player.addEventListener('error', (event) => {
          const detail = event.detail;
          showError(
            `Video load nahi hui. Shaka error code: ${detail?.code || 'Unknown'}`
          );
        });

        await player.load(videoUrl);

        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        showError(
          err?.message || 'Shaka Player video load nahi kar saka.'
        );
      }
    }

    setupPlayer();

    return () => {
      cancelled = true;

      if (player) {
        player.destroy();
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl, onFatalError]);

  return (
    <div className="pm-video-wrapper">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className={className}
        aria-label={title || 'Video player'}
        onCanPlay={() => setStatus('ready')}
      />

      {status === 'loading' && (
        <div className="pm-player-note">Loading video...</div>
      )}

      {status === 'error' && (
        <div className="pm-player-note pm-error">{error}</div>
      )}
    </div>
  );
}
