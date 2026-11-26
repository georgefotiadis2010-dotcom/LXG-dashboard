import React, { useEffect, useRef } from 'react';

export type WaterStatus = 'neon' | 'ahead' | 'ontrack' | 'below';

interface WaterProgressCanvasProps {
  fillPct: number;
  status: WaterStatus;
}

const STATUS_PALETTE: Record<
  WaterStatus,
  { top: string; bottom: string; rim: string; glow: string }
> = {
  neon: {
    top: 'rgba(57, 255, 20, 0.24)',
    bottom: 'rgba(22, 163, 74, 0.14)',
    rim: 'rgba(134, 255, 112, 0.55)',
    glow: 'rgba(57, 255, 20, 0.28)',
  },
  ahead: {
    top: 'rgba(109, 213, 140, 0.22)',
    bottom: 'rgba(16, 185, 129, 0.12)',
    rim: 'rgba(140, 232, 166, 0.45)',
    glow: 'rgba(109, 213, 140, 0.22)',
  },
  ontrack: {
    top: 'rgba(96, 165, 250, 0.22)',
    bottom: 'rgba(37, 99, 235, 0.12)',
    rim: 'rgba(147, 197, 253, 0.45)',
    glow: 'rgba(96, 165, 250, 0.22)',
  },
  below: {
    top: 'rgba(248, 113, 113, 0.22)',
    bottom: 'rgba(185, 28, 28, 0.12)',
    rim: 'rgba(252, 165, 165, 0.45)',
    glow: 'rgba(248, 113, 113, 0.2)',
  },
};

export const WaterProgressCanvas: React.FC<WaterProgressCanvasProps> = ({
  fillPct,
  status,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetFillRef = useRef(fillPct / 100);
  const currentFillRef = useRef(0);
  const velocityRef = useRef(0);
  const rippleRef = useRef(0);

  useEffect(() => {
    targetFillRef.current = Math.max(0, Math.min(1, fillPct / 100));
    // Add a gentle slosh impulse when fill target changes
    velocityRef.current += 0.015;
  }, [fillPct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let t = Math.random() * Math.PI * 2;
    const palette = STATUS_PALETTE[status];

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w > 0 && h > 0) {
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Spring physics for horizontal fill level
        const force = (targetFillRef.current - currentFillRef.current) * 0.06;
        velocityRef.current = (velocityRef.current + force) * 0.86;
        currentFillRef.current += velocityRef.current;
        rippleRef.current *= 0.94;

        const fillX = Math.max(0, Math.min(w, currentFillRef.current * w));

        if (fillX > 0.5) {
          t += 0.045;
          const isFull = targetFillRef.current >= 0.999 && Math.abs(velocityRef.current) < 0.002;
          const waveAmp = isFull ? 0 : Math.min(5, 2.2 + Math.abs(velocityRef.current) * 80 + rippleRef.current);

          ctx.beginPath();
          ctx.moveTo(0, 0);

          if (isFull) {
            ctx.lineTo(w, 0);
            ctx.lineTo(w, h);
          } else {
            const steps = 16;
            for (let i = 0; i <= steps; i++) {
              const y = (i / steps) * h;
              const wave =
                Math.sin(y * 0.14 + t) * waveAmp +
                Math.cos(y * 0.08 - t * 1.3) * (waveAmp * 0.45);
              const x = Math.max(0, Math.min(w, fillX + wave));
              ctx.lineTo(x, y);
            }
          }

          ctx.lineTo(0, h);
          ctx.closePath();

          // Subtle vertical liquid gradient
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, palette.top);
          grad.addColorStop(1, palette.bottom);
          ctx.fillStyle = grad;
          ctx.shadowColor = palette.glow;
          ctx.shadowBlur = 10;
          ctx.fill();

          // Subtle meniscus / leading wave rim
          if (!isFull) {
            ctx.beginPath();
            const steps = 16;
            for (let i = 0; i <= steps; i++) {
              const y = (i / steps) * h;
              const wave =
                Math.sin(y * 0.14 + t) * waveAmp +
                Math.cos(y * 0.08 - t * 1.3) * (waveAmp * 0.45);
              const x = Math.max(0, Math.min(w, fillX + wave));
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = palette.rim;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = palette.glow;
            ctx.shadowBlur = 8;
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={() => {
        rippleRef.current = Math.min(4, rippleRef.current + 0.8);
      }}
      className="absolute inset-0 h-full w-full"
    />
  );
};
