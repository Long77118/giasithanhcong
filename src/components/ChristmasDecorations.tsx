'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './christmas-decorations.css';

function BannerDecoration() {
  return (
    <svg className="seasonal-banner-decoration" viewBox="0 0 174 114" aria-hidden="true" focusable="false">
      <path d="M104 0h21l49 49v21Z" fill="var(--season-brick)" />
      <path d="M110 0h3l61 61v3Z" fill="var(--season-champagne)" opacity=".9" />
      <path d="M86 15q9-19 17-12c4 4-2 9-15 13 16-1 23 2 22 7-2 9-16 3-24-5Z" fill="none" stroke="var(--season-brick)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M86 15Q74 7 66 13c-7 8 4 12 20 5m2-2c-3 8-6 14-15 18m16-16q7 9 19 11" fill="none" stroke="var(--season-brick)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18 2C47 7 63 13 88 16M27 5 32 17M36 7l9 14M46 10l13 13M52 11l14 10M30 5l17-4M42 8l19-5M55 12l16-4" fill="none" stroke="var(--season-forest)" strokeWidth="1.25" strokeLinecap="round" opacity=".62" />
      <g className="seasonal-banner-baubles">
        <path d="M43 1v37m85 10v24" fill="none" stroke="var(--season-gold-edge)" strokeWidth="1" />
        <path d="M40 37h6v4h-6zm85 33h6v4h-6z" fill="var(--season-gold-edge)" />
        <circle cx="43" cy="51" r="11" fill="var(--season-champagne)" stroke="var(--season-gold-edge)" />
        <path d="M35 48q8 6 16 0m-16 7q8 6 16 0" fill="none" stroke="var(--season-gold-edge)" strokeWidth=".8" opacity=".7" />
        <circle cx="128" cy="82" r="9" fill="var(--season-brick)" opacity=".85" />
        <path d="M125 78q-4 3-1 7" fill="none" stroke="var(--season-gold-edge)" strokeWidth="1.05" strokeLinecap="round" />
      </g>
      <path d="M142 30v12m-6-6h12M79 55v14m-7-7h14m66 31v10m-5-5h10" fill="none" stroke="var(--season-gold-edge)" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

export default function ChristmasDecorations() {
  const [targets, setTargets] = useState<{
    banner: Element;
    productsTitle: HTMLElement | null;
    newsTitle: HTMLElement | null;
    footer: HTMLElement | null;
  }>();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const attach = () => {
      const banner = main.querySelector('.home-banner-wrap');
      const productsTitle = document.getElementById('home-shop-heading');
      const newsTitle = document.getElementById('home-blog-heading');
      const footer = document.getElementById('site-footer-content')?.parentElement ?? null;
      if (!banner) return;
      if (productsTitle && newsTitle) observer.disconnect();
      setTargets(current => current?.banner === banner && current.productsTitle === productsTitle && current.newsTitle === newsTitle && current.footer === footer
        ? current : { banner, productsTitle, newsTitle, footer });
    };
    const observer = new MutationObserver(attach);
    observer.observe(main, { childList: true, subtree: true });
    attach();
    return () => observer.disconnect();
  }, []);

  if (!targets) return null;
  const { banner, productsTitle, newsTitle, footer } = targets;

  return (
    <>
      {createPortal(
        <>
          <BannerDecoration />
          <svg className="seasonal-banner-snowflake" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
            <path d="M40 6v68M10.5 23l59 34m0-34-59 34M29 12l11 11 11-11M29 68l11-11 11 11M11 37l15-4-4-15m36 44-4-15 15-4M11 43l15 4-4 15m36-44-4 15 15 4" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>,
        banner,
      )}
      {productsTitle && createPortal(
        <svg className="seasonal-title-cap" viewBox="0 0 34 11" aria-hidden="true" focusable="false">
          <path d="M1 7c0-1.8 2.1-3.5 4.7-3.5C6.2.3 11-.1 13 2.1 15.8.4 19.2.9 21 3c1.7-.9 4.8-.4 6.2 1.4C30.3 3.8 33 5.2 33 7.4c0 2.1-2.6 2.3-5.7 1.8-3.2-.5-4.8-1-7 .1-3 1.2-5.8-.8-9.2 0C6 10.7 1 10 1 7Z" fill="#fffefa" stroke="var(--season-gold-edge)" strokeWidth=".65" />
        </svg>,
        productsTitle,
      )}
      {newsTitle && createPortal(
        <svg className="seasonal-title-bauble" viewBox="0 0 18 25" aria-hidden="true" focusable="false">
          <path d="M9 1v7m-2 0h4v4H7z" fill="none" stroke="var(--season-gold-edge)" />
          <circle cx="9" cy="17" r="6" fill="var(--season-brick)" />
          <path d="M5.5 17q3.5 2 7 0" fill="none" stroke="var(--season-champagne)" strokeWidth=".85" />
        </svg>,
        newsTitle,
      )}
      {footer && createPortal(
        <svg className="seasonal-footer-decoration" viewBox="0 0 320 24" aria-hidden="true" focusable="false">
          <path d="M1 12h115m88 0h115" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4" />
          <path d="M132 12h14m-11-4 4 4-4 4m7-4 4-4m-4 4 4 4m28-4h14m-14-4 4 4-4 4m7-4 4-4m-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M151 10h18v4h-18zm2 4v7h14v-7m-7-4v11m0-11c-9 0-8-8-3-5l3 5c9 0 8-8 3-5Z" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>,
        footer,
      )}
    </>
  );
}
