import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import type { TelemetryMonthSnapshot, TelemetryPlatform } from '../types/lxg';
import { LXG_TELEMETRY_CONFIG } from '../context/LxgContext';
import OdometerNumber from './OdometerNumber';

export interface TelemetrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  platform: TelemetryPlatform;
  snapshot: TelemetryMonthSnapshot;
  focusedStatId?: string | null;
}

interface SparkPoint {
  x: number;
  y: number;
  value: number;
  dayIndex: number;
}

const SVG_W = 340;
const SVG_H = 112;
const PAD_X = 6;
const PAD_Y = 12;

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

function buildSmoothSparkline(values: number[]): {
  points: SparkPoint[];
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
} {
  if (!values.length) {
    return { points: [], linePath: '', areaPath: '', min: 0, max: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const innerW = SVG_W - PAD_X * 2;
  const innerH = SVG_H - PAD_Y * 2;

  const points: SparkPoint[] = values.map((val, idx) => {
    const x =
      values.length === 1
        ? SVG_W / 2
        : PAD_X + (idx / (values.length - 1)) * innerW;
    const norm = (val - min) / span;
    const y = PAD_Y + (1 - norm) * innerH;
    return { x, y, value: val, dayIndex: idx };
  });

  if (points.length === 1) {
    const p = points[0];
    return {
      points,
      linePath: `M ${p.x} ${p.y}`,
      areaPath: `M ${p.x} ${SVG_H} L ${p.x} ${p.y} L ${p.x} ${SVG_H} Z`,
      min,
      max,
    };
  }

  // Catmull-Rom to Cubic Bezier conversion for smooth editorial curve
  let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(
      2
    )} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${SVG_H} L ${first.x.toFixed(
    2
  )} ${SVG_H} Z`;

  return { points, linePath, areaPath, min, max };
}

export const TelemetrySheet: React.FC<TelemetrySheetProps> = ({
  isOpen,
  onClose,
  platform,
  snapshot,
  focusedStatId,
}) => {
  const platformConfig = LXG_TELEMETRY_CONFIG.platforms[platform];
  const accent = platformConfig.theme.primary;
  const deep = platformConfig.theme.deep;

  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, linePath, areaPath } = useMemo(
    () => buildSmoothSparkline(snapshot.sparkline),
    [snapshot.sparkline]
  );

  const activeIndex =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? hoverIndex
      : points.length - 1;
  const activePoint = points[activeIndex];

  const focusedStat = useMemo(
    () =>
      focusedStatId
        ? snapshot.secondaryStats.find((s) => s.id === focusedStatId) ?? null
        : null,
    [focusedStatId, snapshot.secondaryStats]
  );

  const updateCrosshairFromClientX = useCallback(
    (clientX: number) => {
      const el = svgRef.current;
      if (!el || points.length === 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
      );
      const idx = Math.round(ratio * (points.length - 1));
      setHoverIndex(idx);
    },
    [points.length]
  );

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 70 || info.velocity.y > 380) {
      onClose();
    }
  };

  const gradientId = `lxg-spark-fill-${platform}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={`${platformConfig.label} ${snapshot.fullLabel} Deep Telemetry`}
        >
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0.0, 0, 1.0] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
            style={{ willChange: 'opacity' }}
          />

          {/* Full-bleed Frosted-Glass Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 28,
              mass: 0.85,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.45 }}
            onDragEnd={handleDragEnd}
            className="relative w-full rounded-t-[28px] border-t border-white/[0.12] bg-[#0B0C10]/80 text-[#F8F9FA] overflow-hidden"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              willChange: 'transform',
            }}
          >
            {/* Subtle top radial accent glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[320px] h-[160px] rounded-full opacity-25 blur-3xl"
              style={{ background: accent }}
            />

            {/* Material You Grabber Pill */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-9 h-1 rounded-full bg-white/25" />
            </div>

            <div className="relative px-5 sm:px-6 pt-1">
              {/* Sheet Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="font-sans text-[13px] font-medium text-[#F8F9FA]/60">
                      {toTitleCase(platformConfig.label)} · {toTitleCase(snapshot.fullLabel)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <OdometerNumber
                      value={
                        focusedStat ? focusedStat.value : snapshot.heroValue
                      }
                      decimals={focusedStat?.decimals ?? 0}
                      suffix={focusedStat?.suffix ?? ''}
                      className="font-sans font-bold tracking-[-0.04em] text-[#F8F9FA]"
                      style={{ fontSize: '2.25rem' }}
                    />
                    <span
                      className="font-sans text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{
                        color: accent,
                        backgroundColor: `${deep}CC`,
                      }}
                    >
                      {toTitleCase(focusedStat ? focusedStat.label : platformConfig.heroLabel)}{' '}
                      {focusedStat ? focusedStat.delta : snapshot.delta}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close telemetry sheet"
                  className="p-2 -mr-1 rounded-full bg-white/[0.06] text-[#F8F9FA]/70 hover:text-[#F8F9FA] hover:bg-white/[0.12] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 30-Day Sparkline Section (Zero Gridlines, Interactive Crosshair) */}
              <div className="mt-5 pt-4 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans text-[13px] font-medium text-[#F8F9FA]/60">
                    30-day trend
                  </span>

                  {activePoint && (
                    <div className="flex items-center gap-2 font-sans">
                      <span className="text-[12px] font-medium text-[#F8F9FA]/50">
                        {activePoint.dayIndex === points.length - 1
                          ? 'Today'
                          : `${points.length - 1 - activePoint.dayIndex}d ago`}
                      </span>
                      <span
                        className="text-[13px] text-[#F8F9FA] font-semibold"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {activePoint.value.toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="relative w-full"
                  style={{ touchAction: 'none' }}
                >
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full h-[112px] overflow-visible cursor-crosshair select-none"
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateCrosshairFromClientX(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons > 0 || e.pointerType === 'mouse') {
                        updateCrosshairFromClientX(e.clientX);
                      }
                    }}
                    onPointerLeave={() => setHoverIndex(null)}
                    onPointerUp={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle Area Under Curve */}
                    {areaPath && (
                      <path d={areaPath} fill={`url(#${gradientId})`} />
                    )}

                    {/* Smooth Bezier Curve Stroke (Zero Gridlines) */}
                    {linePath && (
                      <motion.path
                        d={linePath}
                        fill="none"
                        stroke={accent}
                        strokeWidth={2.25}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0.4 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{
                          duration: 0.65,
                          ease: [0.2, 0.0, 0, 1.0],
                        }}
                      />
                    )}

                    {/* Interactive Crosshair & Active Node */}
                    {activePoint && (
                      <g>
                        <line
                          x1={activePoint.x}
                          y1={0}
                          x2={activePoint.x}
                          y2={SVG_H}
                          stroke="rgba(248, 249, 250, 0.25)"
                          strokeWidth={1}
                          strokeDasharray="2 3"
                        />
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r={6}
                          fill={accent}
                          fillOpacity={0.22}
                        />
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r={3}
                          fill="#F8F9FA"
                          stroke={accent}
                          strokeWidth={1.5}
                        />
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Top-Performing Track / Reel Callout */}
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-sans text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.09] text-[#F8F9FA]/90"
                      >
                        {toTitleCase(
                          snapshot.topCallout.accentTag ??
                            (snapshot.topCallout.kind === 'track'
                              ? 'Top track'
                              : 'Top reel')
                        )}
                      </span>
                      <span className="font-sans text-[11px] font-medium text-[#F8F9FA]/50 truncate">
                        {snapshot.topCallout.meta.replace(/\s*\/\/\s*/g, ' · ')}
                      </span>
                    </div>

                    <p className="mt-1.5 font-sans font-semibold text-base tracking-tight text-[#F8F9FA] truncate">
                      {snapshot.topCallout.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-sans font-bold text-lg tracking-tight text-[#F8F9FA] tabular-nums">
                      {snapshot.topCallout.metricValue.toLocaleString('en-US')}
                    </div>
                    <div
                      className="font-sans text-[11px] font-medium"
                      style={{ color: accent }}
                    >
                      {toTitleCase(snapshot.topCallout.metricLabel)}{' '}
                      {snapshot.topCallout.delta}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TelemetrySheet;
