
'use client';

import { useEffect, useRef, useState } from 'react';

function isHls(url) {
  return /\.m3u8(?:\?|$)/i.test(url || '');
}

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

  // PrepMasterApp sends `src`; `url` is also supported.
  const videoUrl = src || url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    let hls;
    let cancelled = false;

    const showError = (message) => {
      if (cancelled) return;
      setStatus('error');
      setError(message);
      onFatalError?.(message);
    };

    setStatus('loading');
    setError('');

    // Use native HLS when the browser supports it.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;

      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    // Use hls.js for browsers without native HLS support.
    if (!isHls(videoUrl)) {
      video.src = videoUrl;

      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;

        if (!Hls.isSupported()) {
          showError('Is browser mein HLS playback supported nahi hai.');
          return;
        }

        hls = new Hls({ enableWorker: true });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data?.fatal) return;

          const message =
            data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? 'Stream load nahi hui. Network, CORS ya access issue ho sakta hai.'
              : 'Video play nahi ho saka.';

          showError(message);
          hls?.destroy();
          hls = null;
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      })
      .catch(() => {
        showError('HLS player load nahi ho saka. hls.js dependency check karo.');
      });

    return () => {
      cancelled = true;
      if (hls) hls.destroy();

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
        onError={() => {
          const message = 'Video play nahi ho saka. Stream URL ya access check karo.';
          setStatus('error');
          setError(message);
          onFatalError?.(message);
        }}
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
