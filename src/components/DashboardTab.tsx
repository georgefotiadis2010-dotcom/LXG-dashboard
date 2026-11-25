import React, { useEffect, useState } from 'react';
import { useLxg } from '../context/LxgContext';
import type { ReelEntry } from '../types/lxg';

function formatCountdown(targetIso: string): {
  label: string;
  sublabel: string;
  isLive: boolean;
} {
  const now = Date.now();
  const target = new Date(targetIso).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { label: 'OUT NOW', sublabel: 'Release Week Active', isLive: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => String(n).padStart(2, '0');
  if (days === 0) {
    return {
      label: `${pad(hours)}:${pad(mins)}:${pad(secs)}`,
      sublabel: 'Drops Tomorrow — Nov 27, 2026',
      isLive: false,
    };
  }

  return {
    label: `${days}d ${pad(hours)}h ${pad(mins)}m`,
    sublabel: 'Drops Nov 27, 2026',
    isLive: false,
  };
}

export const DashboardTab: React.FC = () => {
  const { state, incrementMetric } = useLxg();
  const { metrics, organicMode, reels, pipeline } = state;

  const [countdown, setCountdown] = useState(() =>
    formatCountdown('2026-11-27T00:00:00')
  );
  const [selectedReel, setSelectedReel] = useState<ReelEntry | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(formatCountdown('2026-11-27T00:00:00'));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const iKnowRelease = pipeline.find((p) => p.id === 'rel-i-know');

  // Pacing against Release Week targets (120 7d streams / 50 7d listeners)
  const current7dStreams = Math.min(120, Math.round(metrics.allTimeStreams * 0.08));
  const current7dListeners = organicMode
    ? metrics.monthlyListeners
    : metrics.monthlyListenersRaw;
  const streamPct = Math.min(100, Math.round((current7dStreams / 120) * 100));
  const listenerPct = Math.min(100, Math.round((current7dListeners / 50) * 100));

  // Circular SVG progress ring for 6.5% toward Dec 20, 2027
  const portfolioPct = metrics.overallPortfolioProgress;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, portfolioPct) / 100) * circumference;

  const displayedListeners = organicMode
    ? metrics.monthlyListeners
    : metrics.monthlyListenersRaw;
  const displayedIg = organicMode
    ? metrics.instagramOrganicFollowers
    : metrics.instagramFollowers;

  return (
    <div className="space-y-4 pb-4">
      {/* Live Countdown Hero Card */}
      <section
        className="relative overflow-hidden rounded-2xl bg-[#121216] p-4"
        style={{
          border: '1px solid rgba(220, 38, 38, 0.45)',
          boxShadow: '0 0 28px rgba(220, 38, 38, 0.18)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#EF4444]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#EF4444]">
                {countdown.isLive ? 'RELEASE WEEK LIVE' : 'DROPS TOMORROW'}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-white">
              &lsquo;I KNOW&rsquo;
            </h2>
            <p className="text-xs text-zinc-400">{countdown.sublabel}</p>
          </div>
          <div className="rounded-xl bg-[#09090B] px-3 py-2 text-right border border-white/10">
            <div className="font-mono text-base font-bold tracking-wider text-white">
              {countdown.label}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              Nov 27, 2026
            </div>
          </div>
        </div>

        {/* Release Week Pacing Bars */}
        <div className="mt-4 space-y-2.5">
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-zinc-300">
                7d Streams Pacing
              </span>
              <span className="font-mono text-zinc-400">
                <strong className="text-white">{current7dStreams}</strong> / 120
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#09090B] border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] transition-all duration-300"
                style={{ width: `${streamPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-zinc-300">
                7d Listeners Pacing
              </span>
              <span className="font-mono text-zinc-400">
                <strong className="text-white">{current7dListeners}</strong> / 50
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#09090B] border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] transition-all duration-300"
                style={{ width: `${listenerPct}%` }}
              />
            </div>
          </div>
        </div>

        {iKnowRelease?.preSaveUrl && (
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px]">
            <span className="text-zinc-400">LANDR Pre-Save</span>
            <a
              href={`https://${iKnowRelease.preSaveUrl}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[#EF4444] underline decoration-[#EF4444]/40 underline-offset-2"
            >
              {iKnowRelease.preSaveUrl}
            </a>
          </div>
        )}
      </section>

      {/* Portfolio Progress Ring + 3 KPI Cards */}
      <section className="grid grid-cols-2 gap-3">
        {/* Circular Progress Ring Card */}
        <div
          className="col-span-2 flex items-center justify-between rounded-2xl bg-[#121216] p-4"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="7"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <span className="absolute font-mono text-sm font-bold text-white">
                {portfolioPct.toFixed(1)}%
              </span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                2027 Horizon
              </div>
              <div className="text-sm font-bold text-white">
                Portfolio Progress
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                Target: Dec 20, 2027
              </div>
            </div>
          </div>
          <span className="rounded-lg bg-[#09090B] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#EF4444] border border-white/10">
            {organicMode ? 'Organic' : 'Raw Spike'}
          </span>
        </div>

        {/* KPI 1: Monthly Listeners */}
        <div
          className="rounded-2xl bg-[#121216] p-3.5"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Monthly Listeners
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-white">
            {displayedListeners.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500">
            {organicMode
              ? `Adj. organic (${metrics.spotifyFollowers} followers)`
              : `Raw active (${metrics.spotifyFollowers} followers)`}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => incrementMetric('monthlyListeners', -1)}
              className="flex-1 rounded-lg bg-[#09090B] py-1 text-xs font-bold text-zinc-300 border border-white/10 active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('monthlyListeners', 1)}
              className="flex-1 rounded-lg bg-[#DC2626]/20 py-1 text-xs font-bold text-[#EF4444] border border-[#DC2626]/40 active:scale-95"
            >
              +1
            </button>
          </div>
        </div>

        {/* KPI 2: All-Time Streams */}
        <div
          className="rounded-2xl bg-[#121216] p-3.5"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            All-Time Streams
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-white">
            {metrics.allTimeStreams.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500">
            {metrics.weeklyOrganicStreams}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => incrementMetric('allTimeStreams', -1)}
              className="flex-1 rounded-lg bg-[#09090B] py-1 text-xs font-bold text-zinc-300 border border-white/10 active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('allTimeStreams', 1)}
              className="flex-1 rounded-lg bg-[#DC2626]/20 py-1 text-xs font-bold text-[#EF4444] border border-[#DC2626]/40 active:scale-95"
            >
              +1
            </button>
          </div>
        </div>

        {/* KPI 3: IG Followers */}
        <div
          className="col-span-2 flex items-center justify-between rounded-2xl bg-[#121216] p-3.5"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              IG Followers
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-white">
                {displayedIg.toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500">
                {organicMode
                  ? `Organic (${metrics.instagramSchoolSpikeFollowers} school spike hidden)`
                  : `Total (${metrics.instagramOrganicFollowers} organic + ${metrics.instagramSchoolSpikeFollowers} spike)`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => incrementMetric('instagramFollowers', -1)}
              className="rounded-lg bg-[#09090B] px-3 py-1.5 text-xs font-bold text-zinc-300 border border-white/10 active:scale-95"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('instagramFollowers', 1)}
              className="rounded-lg bg-[#DC2626]/20 px-3 py-1.5 text-xs font-bold text-[#EF4444] border border-[#DC2626]/40 active:scale-95"
            >
              +1
            </button>
          </div>
        </div>
      </section>

      {/* Horizontal Scrollable Recent Reels Strip */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-300">
            Recent Reels ({reels.length})
          </h3>
          <span className="text-[11px] text-zinc-500">
            Tap card for diagnostics
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {reels.map((reel) => (
            <button
              key={reel.id}
              type="button"
              onClick={() => setSelectedReel(reel)}
              className="w-56 shrink-0 rounded-2xl bg-[#121216] p-3 text-left transition hover:border-[#DC2626]/50 active:scale-[0.98]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="rounded bg-[#09090B] px-1.5 py-0.5 font-bold text-[#EF4444] border border-white/10">
                  {reel.track}
                </span>
                <span className="font-mono text-zinc-500">{reel.date}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-semibold text-white">
                &ldquo;{reel.hook}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px]">
                <span className="text-white font-bold">
                  {reel.views.toLocaleString()} views
                </span>
                <span className="text-[#EF4444]">{reel.engagementRate}% ER</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Diagnostic Bottom-Sheet Modal */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setSelectedReel(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-[#121216] p-5 pb-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
            <div className="flex items-center justify-between">
              <span className="rounded bg-[#DC2626]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EF4444] border border-[#DC2626]/40">
                {selectedReel.track}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                {selectedReel.date}
              </span>
            </div>

            <h4 className="mt-3 text-base font-bold text-white">
              &ldquo;{selectedReel.hook}&rdquo;
            </h4>
            <p className="mt-1 text-xs text-zinc-400">
              Visual Format: {selectedReel.visualFormat}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-white">
                  {selectedReel.views.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500">Views</div>
              </div>
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-[#EF4444]">
                  {selectedReel.engagementRate}%
                </div>
                <div className="text-[10px] text-zinc-500">Eng. Rate</div>
              </div>
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-white">
                  {selectedReel.shares}
                </div>
                <div className="text-[10px] text-zinc-500">Shares</div>
              </div>
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-white">
                  {selectedReel.likes}
                </div>
                <div className="text-[10px] text-zinc-500">Likes</div>
              </div>
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-white">
                  {selectedReel.comments}
                </div>
                <div className="text-[10px] text-zinc-500">Comments</div>
              </div>
              <div className="rounded-xl bg-[#09090B] p-2.5 text-center border border-white/10">
                <div className="font-mono text-sm font-bold text-white">
                  {selectedReel.saves}
                </div>
                <div className="text-[10px] text-zinc-500">Saves</div>
              </div>
            </div>

            {(selectedReel.note || selectedReel.flag) && (
              <div className="mt-4 space-y-2">
                {selectedReel.note && (
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300 border border-emerald-500/20">
                    <strong>Insight:</strong> {selectedReel.note}
                  </div>
                )}
                {selectedReel.flag && (
                  <div className="rounded-xl bg-[#DC2626]/15 p-3 text-xs text-[#EF4444] border border-[#DC2626]/30">
                    <strong>Timing / Hook Flag:</strong> {selectedReel.flag}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedReel(null)}
              className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
