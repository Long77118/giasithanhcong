'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MapPin, Navigation, X } from 'lucide-react';

export function ContactMap({ embedUrl, address, brandName, directionsHref }: {
  embedUrl: string; address: string; brandName: string; directionsHref: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const launchRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (loaded) closeRef.current?.focus({ preventScroll: true }); }, [loaded]);
  return <section className="contact-map" aria-labelledby="contact-map-heading">
    <div className="contact-map-copy">
      <span className="contact-map-emblem"><Navigation size={23} aria-hidden="true" /></span>
      <h2 id="contact-map-heading">Tìm đường đến<br />{brandName}</h2>
      <p>{address}</p>
      <nav aria-label="Chỉ đường trên Google Maps"><a className="contact-button contact-button--green" href={directionsHref}
        target="_blank" rel="noopener noreferrer">Chỉ đường<ArrowUpRight size={18} aria-hidden="true" /></a></nav>
    </div>
    <div className="contact-map-stage">
      {loaded ? <>
        <div className="contact-map-toolbar"><span>Google Maps</span><button ref={closeRef} type="button" className="contact-map-close" onClick={() => {
          setLoaded(false);
          requestAnimationFrame(() => launchRef.current?.focus({ preventScroll: true }));
        }}><X size={17} aria-hidden="true" />Đóng bản đồ</button></div>
        <iframe title={`Bản đồ vị trí ${brandName}`} src={embedUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </> : <button ref={launchRef} type="button" className="contact-map-launch" onClick={() => setLoaded(true)}>
        <svg className="contact-map-lines" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M-40 95C100 15 155 205 310 120S500 70 690 170M40-30C150 90 135 200 280 260S450 310 520 440" />
          <path d="M-30 315 670 60M120-30 40 440M470-30 610 440" />
          <circle cx="330" cy="200" r="90" /><circle cx="330" cy="200" r="145" />
        </svg>
        <span className="contact-map-pin"><MapPin size={40} strokeWidth={1.5} aria-hidden="true" /></span>
        <span className="contact-map-launch-label">Mở bản đồ tương tác<ArrowUpRight size={18} aria-hidden="true" /></span>
        <span className="contact-map-source">Google Maps · Bấm để tải</span>
      </button>}
    </div>
  </section>;
}
