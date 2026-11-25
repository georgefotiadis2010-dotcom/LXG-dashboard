import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Minus, Plus } from 'lucide-react';
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
      sublabel: 'Drops tomorrow · Nov 27',
      isLive: false,
    };
  }

  return {
    label: `${days}d ${pad(hours)}h ${pad(mins)}m`,
    sublabel: 'Drops Nov 27, 2026',
    isLive: false,
  };
}

function getPaceStatus(pct: number): {
  label: string;
  headline: string;
  pillClass: string;
  barClass: string;
  isOnTrack: boolean;
} {
  if (pct >= 70) {
    return {
      label: 'On track',
      headline: 'On track',
      pillClass: 'bg-[#6DD58C]/15 text-[#6DD58C]',
      barClass: 'bg-[#6DD58C]',
      isOnTrack: true,
    };
  }
  if (pct >= 40) {
    return {
      label: 'Needs push',
      headline: 'Slightly behind',
      pillClass: 'bg-[#FCD34D]/15 text-[#FCD34D]',
      barClass: 'bg-[#FCD34D]',
      isOnTrack: false,
    };
  }
  return {
    label: 'Behind',
    headline: 'Behind pace',
    pillClass: 'bg-[#F2B8B5]/15 text-[#F2B8B5]',
    barClass: 'bg-[#F2B8B5]',
    isOnTrack: false,
  };
}

export const DashboardTab: React.FC = () => {
  const { state, incrementMetric } = useLxg();
  const { metrics, reels, pipeline } = state;

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
  const current7dListeners = metrics.monthlyListeners;
  const streamPct = Math.min(100, Math.round((current7dStreams / 120) * 100));
  const listenerPct = Math.min(100, Math.round((current7dListeners / 50) * 100));
  const overallPacePct = Math.round((streamPct + listenerPct) / 2);

  const overallStatus = getPaceStatus(overallPacePct);
  const streamStatus = getPaceStatus(streamPct);
  const listenerStatus = getPaceStatus(listenerPct);

  const portfolioPct = metrics.overallPortfolioProgress;

  return (
    <div className="space-y-4 pb-4">
      {/* At-a-Glance Status Greeting */}
      <section className="px-1 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-400">
              Release Week Checkup
            </p>
            <h2 className="mt-0.5 text-[32px] leading-tight font-bold tracking-tight text-[#E3E2E6]">
              {overallStatus.headline}
            </h2>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold ${overallStatus.pillClass}`}
          >
            {overallStatus.isOnTrack ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{overallPacePct}% pace</span>
          </div>
        </div>
      </section>

      {/* Fluid Hero Release Card */}
      <section className="rounded-[28px] bg-[#1B1E24] p-5 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#252A34] px-2.5 py-1 text-[11px] font-medium text-[#F2B8B5]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F2B8B5]" />
              <span>{countdown.isLive ? 'Out Now' : 'Next Drop'}</span>
            </div>
            <h3 className="mt-2.5 text-2xl font-bold tracking-tight text-[#E3E2E6]">
              &lsquo;I KNOW&rsquo;
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">{countdown.sublabel}</p>
          </div>

          <div className="rounded-2xl bg-[#252A34] px-3.5 py-2.5 text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-zinc-400">
              <Clock className="h-3 w-3" />
              <span>Countdown</span>
            </div>
            <div className="mt-0.5 font-mono text-base font-bold tracking-tight text-[#E3E2E6]">
              {countdown.label}
            </div>
          </div>
        </div>

        {/* Smooth Overall Release Pace Bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-400">Weekly target pace</span>
            <span className="font-semibold text-[#E3E2E6]">{overallPacePct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#111318]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overallStatus.barClass}`}
              style={{ width: `${overallPacePct}%` }}
            />
          </div>
        </div>

        {iKnowRelease?.preSaveUrl && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#232730] px-3.5 py-2.5 text-xs">
            <span className="text-zinc-400">LANDR Pre-Save</span>
            <a
              href={`https://${iKnowRelease.preSaveUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#A8C7FA] hover:underline"
            >
              <span>{iKnowRelease.preSaveUrl}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </section>

      {/* Big 2x2 Squircle KPI Grid */}
      <section className="grid grid-cols-2 gap-3">
        {/* 7d Streams */}
        <div className="rounded-[28px] bg-[#1B1E24] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-400">7d Streams</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${streamStatus.pillClass}`}
            >
              {streamStatus.label}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#E3E2E6]">
              {current7dStreams}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">of 120 target</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#111318]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${streamStatus.barClass}`}
              style={{ width: `${streamPct}%` }}
            />
          </div>
        </div>

        {/* 7d Listeners */}
        <div className="rounded-[28px] bg-[#1B1E24] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-400">7d Listeners</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${listenerStatus.pillClass}`}
            >
              {listenerStatus.label}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#E3E2E6]">
              {current7dListeners}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">of 50 target</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#111318]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${listenerStatus.barClass}`}
              style={{ width: `${listenerPct}%` }}
            />
          </div>
        </div>

        {/* Monthly Listeners */}
        <div className="rounded-[28px] bg-[#1B1E24] p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-zinc-400">
            Monthly Listeners
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold tracking-tight text-[#E3E2E6]">
              {metrics.monthlyListeners.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              {metrics.spotifyFollowers} followers
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => incrementMetric('monthlyListeners', -1)}
              aria-label="Decrease monthly listeners"
              className="flex h-8 flex-1 items-center justify-center rounded-full bg-[#252A34] text-zinc-300 transition active:scale-95"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('monthlyListeners', 1)}
              aria-label="Increase monthly listeners"
              className="flex h-8 flex-1 items-center justify-center rounded-full bg-[#6DD58C]/15 text-[#6DD58C] transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2027 Portfolio Goal */}
        <div className="rounded-[28px] bg-[#1B1E24] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-400">Portfolio</span>
            <span className="rounded-full bg-[#252A34] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              2027
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-bold tracking-tight text-[#E3E2E6]">
              {portfolioPct.toFixed(1)}%
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              Dec 20, 2027 goal
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#111318]">
            <div
              className="h-full rounded-full bg-[#A8C7FA] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(4, portfolioPct))}%` }}
            />
          </div>
        </div>
      </section>

      {/* Clean Tonal Row: All-Time Streams & IG Followers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-[28px] bg-[#1B1E24] px-5 py-4">
          <div>
            <div className="text-xs font-medium text-zinc-400">
              All-Time Streams
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold tracking-tight text-[#E3E2E6]">
                {metrics.allTimeStreams.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => incrementMetric('allTimeStreams', -1)}
              aria-label="Decrease all-time streams"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#252A34] text-zinc-300 transition active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('allTimeStreams', 1)}
              aria-label="Increase all-time streams"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6DD58C]/15 text-[#6DD58C] transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[28px] bg-[#1B1E24] px-5 py-4">
          <div>
            <div className="text-xs font-medium text-zinc-400">
              Instagram Followers
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold tracking-tight text-[#E3E2E6]">
                {metrics.instagramFollowers.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => incrementMetric('instagramFollowers', -1)}
              aria-label="Decrease IG followers"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#252A34] text-zinc-300 transition active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => incrementMetric('instagramFollowers', 1)}
              aria-label="Increase IG followers"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6DD58C]/15 text-[#6DD58C] transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Horizontal Scrollable Recent Reels Strip */}
      <section className="pt-1">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-[#E3E2E6]">
            Recent Reels ({reels.length})
          </h3>
          <span className="text-xs text-zinc-500">Tap for details</span>
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {reels.map((reel) => (
            <button
              key={reel.id}
              type="button"
              onClick={() => setSelectedReel(reel)}
              className="w-56 shrink-0 rounded-[24px] bg-[#1B1E24] p-4 text-left transition active:scale-[0.98]"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="rounded-full bg-[#252A34] px-2.5 py-0.5 font-medium text-[#A8C7FA]">
                  {reel.track}
                </span>
                <span className="text-zinc-500">{reel.date}</span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-xs font-medium leading-relaxed text-[#E3E2E6]">
                &ldquo;{reel.hook}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 text-xs">
                <span className="font-semibold text-[#E3E2E6]">
                  {reel.views.toLocaleString()} views
                </span>
                <span className="font-medium text-[#6DD58C]">
                  {reel.engagementRate}% ER
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Material You Bottom-Sheet Modal */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedReel(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[32px] bg-[#1B1E24] p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-600" />
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#252A34] px-3 py-1 text-xs font-medium text-[#A8C7FA]">
                {selectedReel.track}
              </span>
              <span className="text-xs text-zinc-400">{selectedReel.date}</span>
            </div>

            <h4 className="mt-3 text-lg font-bold text-[#E3E2E6]">
              &ldquo;{selectedReel.hook}&rdquo;
            </h4>
            <p className="mt-1 text-xs text-zinc-400">
              Format: {selectedReel.visualFormat}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#E3E2E6]">
                  {selectedReel.views.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-400">Views</div>
              </div>
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#6DD58C]">
                  {selectedReel.engagementRate}%
                </div>
                <div className="text-[11px] text-zinc-400">Eng. Rate</div>
              </div>
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#E3E2E6]">
                  {selectedReel.shares}
                </div>
                <div className="text-[11px] text-zinc-400">Shares</div>
              </div>
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#E3E2E6]">
                  {selectedReel.likes}
                </div>
                <div className="text-[11px] text-zinc-400">Likes</div>
              </div>
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#E3E2E6]">
                  {selectedReel.comments}
                </div>
                <div className="text-[11px] text-zinc-400">Comments</div>
              </div>
              <div className="rounded-2xl bg-[#232730] p-3 text-center">
                <div className="text-base font-bold text-[#E3E2E6]">
                  {selectedReel.saves}
                </div>
                <div className="text-[11px] text-zinc-400">Saves</div>
              </div>
            </div>

            {(selectedReel.note || selectedReel.flag) && (
              <div className="mt-4 space-y-2">
                {selectedReel.note && (
                  <div className="rounded-2xl bg-[#6DD58C]/10 p-3.5 text-xs text-[#6DD58C]">
                    <strong>Insight:</strong> {selectedReel.note}
                  </div>
                )}
                {selectedReel.flag && (
                  <div className="rounded-2xl bg-[#F2B8B5]/10 p-3.5 text-xs text-[#F2B8B5]">
                    <strong>Flag:</strong> {selectedReel.flag}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedReel(null)}
              className="mt-5 w-full rounded-full bg-[#2A313D] py-3 text-xs font-semibold text-[#E3E2E6] transition active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
