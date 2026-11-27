import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LxgTelemetryConfig,
  TelemetryMonthSnapshot,
  TelemetryPlatform,
  TelemetryViewMode,
} from '../types/lxg';
import { OdometerNumber } from './OdometerNumber';

interface HeroTelemetryProps {
  activePlatform: TelemetryViewMode;
  telemetry: LxgTelemetryConfig;
  spotifySnapshot: TelemetryMonthSnapshot;
  instagramSnapshot: TelemetryMonthSnapshot;
  onOpenSheet: (platform: TelemetryPlatform, statId?: string) => void;
}

const EXPRESSIVE_EASE: [number, number, number, number] = [0.2, 0, 0, 1];

function toSentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function formatMonthPill(fullLabel: string, monthCode: string): string {
  const parts = fullLabel.trim().split(/\s+/);
  const year = parts[1] ?? '';
  const monthTitle = toSentenceCase(monthCode);
  return year ? `${monthTitle} ${year}` : monthTitle;
}

function formatGoalValue(value: number, decimals?: number, suffix?: string): string {
  let formatted: string;
  if (typeof decimals === 'number' && decimals > 0) {
    formatted = value.toFixed(decimals);
  } else if (value >= 1000) {
    const k = value / 1000;
    formatted = `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}K`;
  } else {
    formatted = value.toLocaleString();
  }
  return `${formatted}${suffix ?? ''}`;
}

export const HeroTelemetry: React.FC<HeroTelemetryProps> = ({
  activePlatform,
  telemetry,
  spotifySnapshot,
  instagramSnapshot,
  onOpenSheet,
}) => {
  if (activePlatform === 'all') {
    return (
      <section
        aria-label="Spotify and Instagram Overview"
        className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-3.5 py-2 sm:px-6 sm:py-3"
      >
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 sm:gap-4">
          {(['spotify', 'instagram'] as const).map((platform) => {
            const config = telemetry.platforms[platform];
            const snapshot = platform === 'spotify' ? spotifySnapshot : instagramSnapshot;
            const accent = config.theme.primary;
            const digitCount = String(Math.round(snapshot.heroValue)).length;

            return (
              <div
                key={platform}
                className="flex min-w-0 flex-col justify-between rounded-[24px] bg-white/[0.04] p-3 backdrop-blur-sm sm:p-5"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}88` }}
                      aria-hidden="true"
                    />
                    <span className="font-sans-ui truncate text-xs font-semibold text-[#F8F9FA]">
                      {config.label}
                    </span>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-sans-ui text-[10px] font-medium"
                    style={
                      snapshot.isGoalMonth
                        ? { color: accent, backgroundColor: `${accent}1F` }
                        : { color: '#A1A7B3', backgroundColor: 'rgba(255,255,255,0.07)' }
                    }
                  >
                    {toSentenceCase(snapshot.month)} · {snapshot.isGoalMonth ? 'Goal' : 'Live'}
                  </span>
                </div>

                {/* Hero Numeral */}
                <button
                  type="button"
                  onClick={() => onOpenSheet(platform)}
                  className="group my-auto flex flex-col items-start py-1.5 text-left focus:outline-none"
                  aria-label={`Open ${config.label} details`}
                >
                  <span className="font-sans-ui mb-1 block text-[11px] font-medium text-[#8E94A0]">
                    {toSentenceCase(config.heroLabel)}
                  </span>
                  <OdometerNumber
                    value={snapshot.heroValue}
                    format={digitCount >= 4 ? 'comma' : 'raw'}
                    className="hero-numeral block max-w-full"
                    style={{
                      fontSize:
                        digitCount >= 4
                          ? 'clamp(2.35rem, min(10dvh, 11vw), 5rem)'
                          : 'clamp(2.85rem, min(12dvh, 13.5vw), 5.75rem)',
                    }}
                  />
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <motion.span
                      key={`${platform}-${snapshot.month}-${snapshot.delta}`}
                      initial={{ scale: 0.92, opacity: 0.7 }}
                      animate={{ scale: [0.92, 1.06, 1], opacity: 1 }}
                      transition={{ duration: 0.34, ease: EXPRESSIVE_EASE }}
                      className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-sans-ui text-[10.5px] font-semibold"
                      style={{
                        color: snapshot.deltaPositive ? accent : '#FF2E63',
                        backgroundColor: snapshot.deltaPositive
                          ? `${accent}1F`
                          : 'rgba(255, 46, 99, 0.16)',
                      }}
                    >
                      {snapshot.deltaPositive ? (
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                      )}
                      {snapshot.delta}
                    </motion.span>
                    <span className="font-sans-ui text-[10.5px] font-medium text-[#8E94A0]">
                      Goal {snapshot.heroGoal.toLocaleString()}
                    </span>
                  </div>
                </button>

                {/* Tonal Secondary Stats */}
                <div className="flex flex-col gap-1.5">
                  {snapshot.secondaryStats.map((stat) => (
                    <button
                      key={stat.id}
                      type="button"
                      onClick={() => onOpenSheet(platform, stat.id)}
                      className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-2.5 py-1.5 text-left transition-all hover:bg-white/[0.08] active:scale-[0.98] focus:outline-none"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-sans-ui block truncate text-[10.5px] font-medium text-[#A1A7B3]">
                          {toSentenceCase(stat.label)}
                        </span>
                        {typeof stat.goal === 'number' && (
                          <span className="font-sans-ui block truncate text-[9.5px] font-medium text-[#8E94A0]">
                            Goal {formatGoalValue(stat.goal, stat.decimals, stat.suffix)}
                          </span>
                        )}
                      </div>
                      <span className="font-display shrink-0 text-[13px] font-semibold tabular-nums tracking-tight text-[#F8F9FA]">
                        <OdometerNumber
                          value={stat.value}
                          decimals={stat.decimals ?? 0}
                          suffix={stat.suffix ?? ''}
                          format={stat.value >= 1000 ? 'compact' : 'raw'}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Single Platform Mode: Spotify or Instagram
  const platform: TelemetryPlatform = activePlatform;
  const config = telemetry.platforms[platform];
  const snapshot = platform === 'spotify' ? spotifySnapshot : instagramSnapshot;
  const accent = config.theme.primary;
  const digitCount = String(Math.round(snapshot.heroValue)).length;

  return (
    <section
      aria-label={`${config.label} Overview`}
      className="relative z-10 flex min-h-0 flex-1 flex-col justify-between overflow-hidden px-4 pb-3 sm:px-6 sm:pb-4"
    >
      {/* Upper Hero Focal Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EXPRESSIVE_EASE }}
          className="flex min-h-0 flex-1 flex-col justify-center py-2"
        >
          {/* Title + Month Pill + Live/Goal Pill + Hero Goal & Delta */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 sm:mb-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-sans-ui truncate text-[13px] font-medium text-[#A1A7B3]">
                {toSentenceCase(config.heroLabel)}
              </span>
              <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-0.5 font-sans-ui text-[11px] font-medium text-[#C4C9D4]">
                {formatMonthPill(snapshot.fullLabel, snapshot.month)}
              </span>
              <span
                className="shrink-0 rounded-full px-2.5 py-0.5 font-sans-ui text-[11px] font-medium"
                style={
                  snapshot.isGoalMonth
                    ? { color: accent, backgroundColor: `${accent}1F` }
                    : { color: '#A1A7B3', backgroundColor: 'rgba(255, 255, 255, 0.06)' }
                }
              >
                {snapshot.isGoalMonth ? 'Monthly goal' : 'Live'}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="font-sans-ui text-xs font-medium text-[#8E94A0]">
                {snapshot.isGoalMonth
                  ? `${snapshot.heroGoal.toLocaleString()} target`
                  : `Goal ${snapshot.heroGoal.toLocaleString()}`}
              </span>
              <motion.div
                key={`${platform}-${snapshot.month}-${snapshot.delta}`}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: [0.9, 1.07, 1], opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 360,
                  damping: 24,
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans-ui text-xs font-semibold sm:px-3"
                style={{
                  color: snapshot.deltaPositive ? accent : '#FF2E63',
                  backgroundColor: snapshot.deltaPositive
                    ? `${accent}20`
                    : 'rgba(255, 46, 99, 0.16)',
                }}
              >
                {snapshot.deltaPositive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{snapshot.delta}</span>
              </motion.div>
            </div>
          </div>

          {/* Massive hero numeral */}
          <button
            type="button"
            onClick={() => onOpenSheet(platform)}
            className="group flex w-full items-baseline text-left focus:outline-none"
            aria-label={`${toSentenceCase(config.heroLabel)}: ${snapshot.heroValue}, Goal ${snapshot.heroGoal}. Tap for 30-day trend`}
          >
            <OdometerNumber
              value={snapshot.heroValue}
              format={digitCount >= 4 ? 'comma' : 'raw'}
              className="hero-numeral block max-w-full"
              style={{
                fontSize:
                  digitCount >= 4
                    ? 'clamp(4.75rem, min(22dvh, 22vw), 11.5rem)'
                    : 'clamp(6rem, min(28dvh, 30vw), 14.5rem)',
              }}
            />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* 3-Column Material You Tonal Secondary Metric Cards */}
      <div
        className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3"
        role="group"
        aria-label="Secondary metrics"
      >
        {snapshot.secondaryStats.map((stat) => (
          <button
            key={stat.id}
            type="button"
            onClick={() => onOpenSheet(platform, stat.id)}
            className="touch-target group flex min-w-0 flex-col justify-between rounded-2xl bg-white/[0.045] px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 sm:px-4 sm:py-3.5"
          >
            <span className="font-sans-ui block w-full truncate text-[11px] font-medium text-[#A1A7B3] sm:text-xs">
              {toSentenceCase(stat.label)}
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="font-display text-xl font-bold tabular-nums tracking-[-0.03em] text-[#F8F9FA] sm:text-2xl">
                <OdometerNumber
                  value={stat.value}
                  decimals={stat.decimals ?? 0}
                  suffix={stat.suffix ?? ''}
                  format={stat.value >= 1000 ? 'compact' : 'raw'}
                />
              </span>
              <span
                className="font-sans-ui hidden text-[11px] font-semibold sm:inline"
                style={{
                  color: stat.deltaPositive ? accent : '#FF2E63',
                }}
              >
                {stat.delta}
              </span>
            </div>
            {typeof stat.goal === 'number' && (
              <span className="font-sans-ui mt-0.5 block w-full truncate text-[10px] font-medium text-[#8E94A0] sm:text-[11px]">
                Goal {formatGoalValue(stat.goal, stat.decimals, stat.suffix)}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

export default HeroTelemetry;
