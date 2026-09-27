'use client';

export default function ShakaPlayer({
  url,
  title = 'Video',
  onClose,
}) {
  return (
    <div className="pm-fullscreen-player">
      <div className="pm-player-topbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
        >
          ←
        </button>

        <span>{title}</span>
      </div>

      <div className="pm-player-video-wrap">
        <video
          src={url}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="pm-direct-video"
        />
      </div>
    </div>
  );
}
