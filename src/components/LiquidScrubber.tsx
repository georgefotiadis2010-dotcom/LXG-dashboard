import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type {
  TelemetryMilestone,
  TelemetryMonthCode,
  TelemetryPlatform,
  TelemetryViewMode,
} from '../types/lxg';
import { LXG_TELEMETRY_CONFIG, TELEMETRY_MONTHS } from '../context/LxgContext';

export interface LiquidScrubberProps {
  /** Active platform or 'all' view mode */
  platform: TelemetryViewMode;
  /** Currently selected month index (0..5 for NOV..APR) */
  activeMonthIndex: number;
  /** Callback when user taps or drags to scrub month index */
  onMonthChange: (index: number) => void;
  /** Optional override for hero value (defaults to context snapshot for active platform/month) */
  heroValue?: number;
  /** Optional override for milestones (defaults to platform milestones) */
  milestones?: TelemetryMilestone[];
  /** Optional className for outer container */
  className?: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const SPOTIFY_PRIMARY: RgbColor = { r: 30, g: 215, b: 96 }; // #1ED760
const SPOTIFY_DEEP: RgbColor = { r: 10, g: 41, b: 22 }; // #0A2916
const INSTAGRAM_PRIMARY: RgbColor = { r: 255, g: 46, b: 99 }; // #FF2E63
const INSTAGRAM_DEEP: RgbColor = { r: 46, g: 9, b: 20 }; // #2E0914

const MILESTONE_POSITIONS = [0.14, 0.29, 0.44, 0.59, 0.74, 0.89] as const;

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(curr: RgbColor, target: RgbColor, t: number): RgbColor {
  return {
    r: lerp(curr.r, target.r, t),
    g: lerp(curr.g, target.g, t),
    b: lerp(curr.b, target.b, t),
  };
}

function rgbaStr(c: RgbColor, alpha: number): string {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${alpha})`;
}

/**
 * Maps heroValue onto [0..1] such that each milestone sits at MILESTONE_POSITIONS[i].
 * This guarantees the visual liquid front crosses each hairline divider at the exact
 * moment heroValue surpasses milestone.value.
 */
function computeMilestoneFillRatio(
  value: number,
  milestones: TelemetryMilestone[]
): number {
  if (!milestones.length) return 0;
  if (value <= 0) return 0.02;

  const firstVal = milestones[0].value;
  if (value <= firstVal) {
    return lerp(0, MILESTONE_POSITIONS[0], Math.max(0, value) / firstVal);
  }

  for (let i = 0; i < milestones.length - 1; i++) {
    const curr = milestones[i].value;
    const next = milestones[i + 1].value;
    if (value <= next) {
      const localT = (value - curr) / Math.max(1, next - curr);
      return lerp(MILESTONE_POSITIONS[i], MILESTONE_POSITIONS[i + 1], localT);
    }
  }

  const lastVal = milestones[milestones.length - 1].value;
  const overflowT = Math.min(1, (value - lastVal) / Math.max(1, lastVal * 0.5));
  return lerp(MILESTONE_POSITIONS[milestones.length - 1], 0.98, overflowT);
}

export const LiquidScrubber: React.FC<LiquidScrubberProps> = ({
  platform,
  activeMonthIndex,
  onMonthChange,
  heroValue: heroValueProp,
  milestones: milestonesProp,
  className = '',
}) => {
  const effectivePlatform: TelemetryPlatform =
    platform === 'instagram' ? 'instagram' : 'spotify';

  const platformConfig = LXG_TELEMETRY_CONFIG.platforms[effectivePlatform];
  const milestones = milestonesProp ?? platformConfig.milestones;
  const snapshot =
    platformConfig.timeline[activeMonthIndex] ?? platformConfig.timeline[5];
  const heroValue = heroValueProp ?? snapshot.heroValue;

  const targetFillRatio = useMemo(
    () => computeMilestoneFillRatio(heroValue, milestones),
    [heroValue, milestones]
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mutable physics state for 60fps rAF loop without React re-renders
  const physicsRef = useRef({
    fill: targetFillRatio,
    fillVel: 0,
    targetFill: targetFillRatio,
    slosh: 0,
    sloshVel: 0,
    ripple: 0.25,
    tiltX: 0,
    phase: 0,
    primaryColor:
      effectivePlatform === 'instagram'
        ? { ...INSTAGRAM_PRIMARY }
        : { ...SPOTIFY_PRIMARY },
    deepColor:
      effectivePlatform === 'instagram'
        ? { ...INSTAGRAM_DEEP }
        : { ...SPOTIFY_DEEP },
    targetPrimary:
      effectivePlatform === 'instagram' ? INSTAGRAM_PRIMARY : SPOTIFY_PRIMARY,
    targetDeep:
      effectivePlatform === 'instagram' ? INSTAGRAM_DEEP : SPOTIFY_DEEP,
    lastPointerX: 0,
    lastPointerTime: 0,
  });

  // Sync targets when props change
  useEffect(() => {
    physicsRef.current.targetFill = targetFillRatio;
    physicsRef.current.ripple = Math.min(1.4, physicsRef.current.ripple + 0.45);
  }, [targetFillRatio]);

  useEffect(() => {
    physicsRef.current.targetPrimary =
      effectivePlatform === 'instagram' ? INSTAGRAM_PRIMARY : SPOTIFY_PRIMARY;
    physicsRef.current.targetDeep =
      effectivePlatform === 'instagram' ? INSTAGRAM_DEEP : SPOTIFY_DEEP;
    physicsRef.current.ripple = Math.min(1.5, physicsRef.current.ripple + 0.65);
  }, [effectivePlatform]);

  // Optional DeviceOrientation tilt support (graceful no-op if unavailable)
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      return;
    }
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.gamma === 'number') {
        // Clamp gamma [-45, 45] -> [-1, 1]
        const normalized = Math.max(-1, Math.min(1, e.gamma / 45));
        physicsRef.current.tiltX = normalized;
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, {
      passive: true,
    });
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 60fps Canvas liquid renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const p = physicsRef.current;

      // Smooth color interpolation
      const colorStep = Math.min(1, dt * 7.5);
      p.primaryColor = lerpRgb(p.primaryColor, p.targetPrimary, colorStep);
      p.deepColor = lerpRgb(p.deepColor, p.targetDeep, colorStep);

      // Spring physics for liquid fill level
      const stiffness = 175;
      const damping = 19;
      const force = (p.targetFill - p.fill) * stiffness;
      p.fillVel = (p.fillVel + force * dt) * Math.exp(-damping * dt);
      p.fill += p.fillVel * dt;

      // Slosh spring physics
      const sloshForce = (-p.slosh + p.tiltX * 0.45) * 90;
      p.sloshVel = (p.sloshVel + sloshForce * dt) * Math.exp(-6.5 * dt);
      p.slosh += p.sloshVel * dt;

      // Decay ripple energy
      p.ripple = Math.max(0.18, p.ripple * Math.exp(-2.8 * dt));
      p.phase += dt * (2.6 + p.ripple * 2.2);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Capsule clip (36px height -> radius = h/2)
      const radius = h / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.clip();

      // Subtle deep ambient track background
      ctx.fillStyle = rgbaStr(p.deepColor, 0.35);
      ctx.fillRect(0, 0, w, h);

      const baseFillX = Math.max(radius * 0.6, Math.min(w, p.fill * w));
      const waveAmp = (4 + p.ripple * 8) * dpr;
      const sloshOffset = p.slosh * 18 * dpr;

      // Layer 1: Secondary deeper trailing wave
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = t * h;
        const wave =
          Math.sin(t * Math.PI * 2.4 - p.phase * 1.15) * waveAmp * 0.85 +
          Math.cos(t * Math.PI * 4.2 + p.phase * 0.8) * waveAmp * 0.35;
        const tiltShift = (0.5 - t) * sloshOffset * 1.1;
        const x = baseFillX + wave + tiltShift + 6 * dpr;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(0, h);
      ctx.closePath();

      const deepGrad = ctx.createLinearGradient(0, 0, baseFillX + 20 * dpr, 0);
      deepGrad.addColorStop(0, rgbaStr(p.deepColor, 0.92));
      deepGrad.addColorStop(0.75, rgbaStr(p.primaryColor, 0.38));
      deepGrad.addColorStop(1, rgbaStr(p.primaryColor, 0.55));
      ctx.fillStyle = deepGrad;
      ctx.fill();

      // Layer 2: Primary luminous liquid body
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = t * h;
        const wave =
          Math.sin(t * Math.PI * 2.8 + p.phase) * waveAmp +
          Math.sin(t * Math.PI * 5.2 - p.phase * 1.45) * waveAmp * 0.28;
        const tiltShift = (0.5 - t) * sloshOffset;
        const x = baseFillX + wave + tiltShift;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(0, h);
      ctx.closePath();

      const mainGrad = ctx.createLinearGradient(0, 0, baseFillX + 12 * dpr, 0);
      mainGrad.addColorStop(0, rgbaStr(p.deepColor, 0.95));
      mainGrad.addColorStop(0.55, rgbaStr(p.primaryColor, 0.65));
      mainGrad.addColorStop(0.92, rgbaStr(p.primaryColor, 0.92));
      mainGrad.addColorStop(1, '#F8F9FA');
      ctx.fillStyle = mainGrad;
      ctx.fill();

      // Specular top hardware-bezel sheen inside capsule
      const sheenGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, baseFillX + waveAmp, h * 0.45);

      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const scrubFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
      );
      const count = TELEMETRY_MONTHS.length;
      const nextIndex = Math.min(
        count - 1,
        Math.max(0, Math.round(ratio * (count - 1)))
      );

      // Inject slosh & ripple from drag velocity
      const now = performance.now();
      const dt = Math.max(8, now - physicsRef.current.lastPointerTime);
      const dx = clientX - physicsRef.current.lastPointerX;
      const vx = dx / dt; // px per ms
      physicsRef.current.sloshVel += Math.max(-1.6, Math.min(1.6, vx * 0.9));
      physicsRef.current.ripple = Math.min(
        1.6,
        physicsRef.current.ripple + Math.abs(vx) * 0.45
      );
      physicsRef.current.lastPointerX = clientX;
      physicsRef.current.lastPointerTime = now;

      if (nextIndex !== activeMonthIndex) {
        onMonthChange(nextIndex);
      }
    },
    [activeMonthIndex, onMonthChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    physicsRef.current.lastPointerX = e.clientX;
    physicsRef.current.lastPointerTime = performance.now();
    scrubFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    scrubFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  };

  const accentHex = platformConfig.theme.primary;
  const monthLabel = toTitleCase(snapshot.fullLabel);

  return (
    <section
      aria-label="Timeline & Milestone Liquid Scrubber"
      className={`w-full select-none flex flex-col justify-end ${className}`}
    >
      {/* Editorial Status Row */}
      <div className="w-full px-5 sm:px-6 mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full transition-colors duration-300"
            style={{ backgroundColor: accentHex }}
          />
          <span className="font-sans text-[13px] font-medium tracking-[-0.01em] text-[#F8F9FA]">
            {monthLabel}
          </span>
        </div>

        <span className="font-sans text-[12px] font-medium text-[#F8F9FA]/50">
          {isDragging ? 'Scrubbing…' : 'Milestones'}
        </span>
      </div>

      {/* Milestone Labels aligned to hairline dividers */}
      <div className="relative w-full px-5 sm:px-6 h-4 mb-1.5">
        <div className="relative w-full h-full">
          {milestones.map((m, i) => {
            const posPct = MILESTONE_POSITIONS[i] * 100;
            const surpassed = heroValue >= m.value;
            return (
              <span
                key={m.label}
                className="absolute top-0 -translate-x-1/2 font-sans text-[11px] font-medium tabular-nums transition-colors duration-300"
                style={{
                  left: `${posPct}%`,
                  color: surpassed ? '#F8F9FA' : 'rgba(248, 249, 250, 0.38)',
                }}
              >
                {m.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Full-bleed interactive scrubber zone */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Month timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={TELEMETRY_MONTHS.length - 1}
        aria-valuenow={activeMonthIndex}
        aria-valuetext={monthLabel}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            onMonthChange(Math.min(TELEMETRY_MONTHS.length - 1, activeMonthIndex + 1));
          } else if (e.key === 'ArrowLeft') {
            onMonthChange(Math.max(0, activeMonthIndex - 1));
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full px-5 sm:px-6 cursor-ew-resize"
        style={{ touchAction: 'none' }}
      >
        {/* 36px Inner Capsule Geometry */}
        <div
          className="relative w-full overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
          style={{ height: '36px' }}
        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            aria-hidden="true"
          />

          {/* Soft Milestone Dividers */}
          <div className="pointer-events-none absolute inset-0">
            {milestones.map((m, i) => {
              const posPct = MILESTONE_POSITIONS[i] * 100;
              const surpassed = heroValue >= m.value;
              return (
                <div
                  key={m.label}
                  className="absolute top-1.5 bottom-1.5 w-[1.5px] rounded-full transition-all duration-300"
                  style={{
                    left: `${posPct}%`,
                    backgroundColor: surpassed
                      ? 'rgba(248, 249, 250, 0.92)'
                      : 'rgba(255, 255, 255, 0.14)',
                    boxShadow: surpassed
                      ? '0 0 8px rgba(248, 249, 250, 0.65)'
                      : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Month Index Rail: Nov .. Apr */}
        <div className="relative w-full mt-3 grid grid-cols-6 items-center gap-1">
          {TELEMETRY_MONTHS.map((code: TelemetryMonthCode, idx: number) => {
            const isActive = idx === activeMonthIndex;
            const shortMonth = toTitleCase(code);
            return (
              <button
                key={code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMonthChange(idx);
                }}
                className="relative py-1.5 flex items-center justify-center rounded-full focus:outline-none"
              >
                {isActive && (
                  <motion.span
                    layoutId="lxg-scrubber-month-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 28,
                    }}
                    className="absolute inset-0 rounded-full bg-white/[0.09] border border-white/[0.1]"
                    style={{ willChange: 'transform' }}
                  />
                )}
                <span
                  className="relative z-10 font-sans text-[12px] font-medium transition-colors duration-200"
                  style={{
                    color: isActive ? '#F8F9FA' : 'rgba(248, 249, 250, 0.45)',
                  }}
                >
                  {shortMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiquidScrubber;
