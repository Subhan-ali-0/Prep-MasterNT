
'use client';

import { useEffect, useRef, useState } from 'react';

function isHls(url) {
  return /\.m3u8(\?|$)/i.test(url || '');
}

export default function HlsVideo({ url, title }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls;
    let cancelled = false;

    setStatus('loading');
    setError('');

    const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');

    if (!isHls(url) || nativeHls) {
      video.src = url;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;

      if (!Hls.isSupported()) {
        setStatus('error');
        setError('Ye browser HLS video support nahi karta.');
        return;
      }

      hls = new Hls({ enableWorker: true });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data?.fatal) return;
        setStatus('error');
        setError(
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? 'Video stream load nahi ho saka (network/access error).'
            : 'Video play nahi ho saka.'
        );
        hls.destroy();
      });

      hls.loadSource(url);
      hls.attachMedia(video);
    });

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [url]);

  return (
    <div className="pm-video-wrapper">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="pm-video"
        aria-label={title}
        onCanPlay={() => setStatus('ready')}
        onError={() => {
          setStatus('error');
          setError('Video play nahi ho saka.');
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
