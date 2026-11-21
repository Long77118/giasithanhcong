'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { youTubeEmbedUrl } from '@/lib/youtube';

interface ProductVideoProps {
  videoId: string;
  title: string;
  thumbnail: string;
  thumbnailAlt: string;
}

export function ProductVideo({ videoId, title, thumbnail, thumbnailAlt }: ProductVideoProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="product-detail-video-frame">
      {loaded ? (
        <iframe
          src={youTubeEmbedUrl(videoId)}
          title={title}
          width={640}
          height={360}
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={0}
          ref={(frame) => { frame?.focus(); }}
        />
      ) : (
        <button type="button" onClick={() => setLoaded(true)} aria-label={`Nạp trình phát video: ${title}`}>
          <img src={thumbnail} alt={thumbnailAlt} width={640} height={360} loading="lazy" decoding="async" />
          <span className="product-detail-play"><Play size={28} aria-hidden="true" fill="currentColor" /></span>
          <span className="product-detail-video-label">Bấm để xem video</span>
        </button>
      )}
    </div>
  );
}
