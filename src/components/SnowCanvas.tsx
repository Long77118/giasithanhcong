'use client';

import { useEffect, useRef } from 'react';
import { getSnowParticleCount, type ActiveSeason } from '@/lib/seasonal-theme';

function createFlake(width: number, height: number) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 1 + Math.random() * 1.3,
    speed: 12 + Math.random() * 21,
    phase: Math.random() * Math.PI * 2,
    opacity: .42 + Math.random() * .36,
  };
}

const frameInterval = 1000 / 30 - 1;
const maxBackingPixels = 3_000_000;

export default function SnowCanvas({ intensity }: Pick<ActiveSeason, 'intensity'>) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const colors = getComputedStyle(canvas);
    const fill = colors.getPropertyValue('--season-snow-fill').trim();
    const outline = colors.getPropertyValue('--season-snow-outline').trim();

    let width = 0;
    let height = 0;
    let flakes: ReturnType<typeof createFlake>[] = [];
    let frame: number | undefined;
    let previousFrame: number | undefined;
    let previousPaint: number | undefined;
    let slowFrames = 0;
    let density = 1;

    const updateFlakeCount = () => {
      const target = Math.round(getSnowParticleCount(intensity, width, height) * density);
      if (flakes.length > target) flakes.length = target;
      while (flakes.length < target) flakes.push(createFlake(width, height));
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(maxBackingPixels / (width * height)));
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle = fill;
      context.strokeStyle = outline;
      context.lineWidth = .7;
      flakes = [];
      updateFlakeCount();
    };

    const paint = (timestamp: number) => {
      const elapsed = previousPaint === undefined ? 0 : Math.min((timestamp - previousPaint) / 1000, .1);
      previousPaint = timestamp;

      context.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.y += flake.speed * elapsed;
        if (flake.y > height + 4) {
          flake.y = -4;
          flake.x = Math.random() * width;
        }

        const x = flake.x + Math.sin(flake.phase + timestamp / 1400) * 7;
        context.globalAlpha = flake.opacity;
        context.beginPath();
        context.arc(x, flake.y, flake.radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    };

    const animate = (timestamp: number) => {
      if (previousFrame !== undefined) {
        slowFrames = timestamp - previousFrame > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames >= 12) {
          density = Math.max(.4, density * .72);
          updateFlakeCount();
          slowFrames = 0;
        }
      }
      previousFrame = timestamp;
      if (previousPaint === undefined || timestamp - previousPaint >= frameInterval) paint(timestamp);
      frame = window.requestAnimationFrame(animate);
    };

    const syncVisibility = () => {
      if (document.hidden) {
        if (frame !== undefined) window.cancelAnimationFrame(frame);
        frame = undefined;
        previousFrame = undefined;
        previousPaint = undefined;
        slowFrames = 0;
      } else if (frame === undefined) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    resize();
    syncVisibility();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [intensity]);

  return <canvas ref={ref} className="seasonal-snow-canvas" aria-hidden="true" />;
}
