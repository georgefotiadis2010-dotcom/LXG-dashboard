import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Clapperboard,
  Disc3,
  Eye,
  Flame,
  Headphones,
  Instagram,
  Pencil,
  Percent,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { METRIC_TARGETS, useLxg } from '../context/LxgContext';

const MONTHLY_LISTENER_GOAL = 50;

type PaceTrend = 'ahead' | 'behind' | 'neutral';

function getMonthProgress(now: Date): number {
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  return Math.min(1, Math.max(1 / daysInMonth, now.getDate() / daysInMonth));
}

function getPaceTrend(
  actual: number,
  target: number,
  monthProgress: number,
  isRate = false
): PaceTrend {
  if (target <= 0) return 'neutral';

  if (isRate) {
    const diff = actual - target;
    if (diff >= 0.3) return 'ahead';
    if (diff <= -0.3) return 'behind';
    return 'neutral';
  }

  if (actual >= target) return 'ahead';
  const diff = actual / target - monthProgress;
  if (diff >= 0.05) return 'ahead';
  if (diff <= -0.05) return 'behind';
  return 'neutral';
}

const TrendArrow: React.FC<{ trend: PaceTrend }> = ({ trend }) => {
  if (trend === 'ahead') {
    return (
      <ArrowUp
        aria-label="Ahead for the month"
        className="h-3 w-3 shrink-0 text-[#6DD58C]"
      />
    );
  }
  if (trend === 'behind') {
    return (
      <ArrowDown
        aria-label="Behind for the month"
        className="h-3 w-3 shrink-0 text-[#F2B8B5]"
      />
    );
  }
  return (
    <ArrowRight
      aria-label="On pace for the month"
      className="h-3 w-3 shrink-0 text-zinc-500"
    />
  );
};

interface MetricCardItem {
  label: string;
  value: string;
  trend: PaceTrend;
  Icon: React.ComponentType<{ className?: string }>;
}

const MetricTile: React.FC<MetricCardItem> = ({ label, value, trend, Icon }) => (
  <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
    <Icon className="h-3.5 w-3.5 text-zinc-400" />
    <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
      {label}
    </span>
    <div className="mt-0.5 inline-flex items-center gap-1">
      <span className="text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
        {value}
      </span>
      <TrendArrow trend={trend} />
    </div>
  </div>
);

export const DashboardTab: React.FC = () => {
  const { state, updateMetrics } = useLxg();
  const { metrics, reels } = state;
  const [spotifyDrawerOpen, setSpotifyDrawerOpen] = useState(false);
  const [draftSpotify, setDraftSpotify] = useState({
    monthlyListeners: String(metrics.monthlyListeners),
    allTimeStreams: String(metrics.allTimeStreams),
    topSingleStreams: String(metrics.topSingleStreams),
    catalogReleases: String(metrics.catalogReleases),
  });

  const openSpotifyDrawer = () => {
    setDraftSpotify({
      monthlyListeners: String(metrics.monthlyListeners),
      allTimeStreams: String(metrics.allTimeStreams),
      topSingleStreams: String(metrics.topSingleStreams),
      catalogReleases: String(metrics.catalogReleases),
    });
    setSpotifyDrawerOpen(true);
  };

  const saveSpotifyDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    updateMetrics({
      monthlyListeners: Math.max(0, Number(draftSpotify.monthlyListeners) || 0),
      allTimeStreams: Math.max(0, Number(draftSpotify.allTimeStreams) || 0),
      topSingleStreams: Math.max(0, Number(draftSpotify.topSingleStreams) || 0),
      catalogReleases: Math.max(0, Number(draftSpotify.catalogReleases) || 0),
    });
    setSpotifyDrawerOpen(false);
  };

  const whatsWorking = useMemo(() => {
    if (!reels.length) return null;
    const byEngagement = [...reels].sort(
      (a, b) => b.engagementRate - a.engagementRate || b.views - a.views
    );
    const topReel = byEngagement[0];

    const formatTotals = new Map<string, { sum: number; count: number }>();
    for (const r of reels) {
      const prev = formatTotals.get(r.visualFormat) ?? { sum: 0, count: 0 };
      formatTotals.set(r.visualFormat, {
        sum: prev.sum + r.engagementRate,
        count: prev.count + 1,
      });
    }
    let topFormat = topReel.visualFormat;
    let bestAvg = -1;
    for (const [fmt, { sum, count }] of formatTotals.entries()) {
      const avg = sum / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        topFormat = fmt;
      }
    }

    return {
      topHook: topReel.hook,
      topEngagement: topReel.engagementRate,
      topFormat,
      topTrack: topReel.track,
    };
  }, [reels]);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthProgress = getMonthProgress(now);

  const monthReels = reels.filter((r) => r.date.startsWith(monthPrefix));
  const monthReelViews = monthReels.reduce((sum, r) => sum + r.views, 0);
  const monthAvgEr =
    monthReels.length > 0
      ? Number(
          (
            monthReels.reduce((sum, r) => sum + r.engagementRate, 0) /
            monthReels.length
          ).toFixed(1)
        )
      : 0;

  const monthlyGoal =
    state.monthlyListenerGoal && state.monthlyListenerGoal > 0
      ? state.monthlyListenerGoal
      : MONTHLY_LISTENER_GOAL;

  const ultimateGoal = METRIC_TARGETS.monthlyListeners.labelReadyRadar;

  const formatCompactGoal = (val: number) => {
    if (val >= 1000) {
      const k = val / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return val.toLocaleString();
  };

  const monthSegments = Array.from({ length: 6 }, (_, i) => {
    const segDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = segDate.toLocaleDateString('en-US', { month: 'short' });
    const monthKey = `${segDate.getFullYear()}-${String(segDate.getMonth() + 1).padStart(2, '0')}`;
    const sheetGoal =
      state.monthlyListenerGoals?.[monthKey] ??
      state.monthlyListenerGoals?.[label] ??
      state.monthlyListenerGoals?.[label.toLowerCase()];
    const t = i / 5;
    const rawGoal = monthlyGoal + (ultimateGoal - monthlyGoal) * t;
    const fallbackGoal =
      i === 0
        ? monthlyGoal
        : i === 5
          ? ultimateGoal
          : Math.round(rawGoal / 500) * 500;
    const goal =
      typeof sheetGoal === 'number' && sheetGoal > 0 ? sheetGoal : fallbackGoal;
    const fillPct =
      goal > 0 ? Math.min(100, Math.round((metrics.monthlyListeners / goal) * 100)) : 0;
    const isCompleted = metrics.monthlyListeners >= goal;
    const isCurrent = i === 0;

    return { label, goal, fillPct, isCompleted, isCurrent };
  });

  console.log('[LXG Dashboard] monthlyListenerGoals:', state.monthlyListenerGoals, 'monthSegments:', monthSegments);

  const listenerTrend = getPaceTrend(
    metrics.monthlyListeners,
    monthlyGoal,
    monthProgress
  );

  const instagramMetrics: MetricCardItem[] = [
    {
      label: 'Followers',
      value: metrics.instagramFollowers.toLocaleString(),
      trend: getPaceTrend(metrics.instagramFollowers, 160, monthProgress),
      Icon: Users,
    },
    {
      label: 'Reel Views',
      value: monthReelViews.toLocaleString(),
      trend: getPaceTrend(monthReelViews, 5000, monthProgress),
      Icon: Eye,
    },
    {
      label: 'Reels',
      value: monthReels.length.toLocaleString(),
      trend: getPaceTrend(monthReels.length, 10, monthProgress),
      Icon: Clapperboard,
    },
    {
      label: 'Avg ER',
      value: `${monthAvgEr.toFixed(1)}%`,
      trend: getPaceTrend(monthAvgEr, 5.5, monthProgress, true),
      Icon: Percent,
    },
  ];

  const spotifyMetrics: MetricCardItem[] = [
    {
      label: 'Listeners',
      value: metrics.monthlyListeners.toLocaleString(),
      trend: listenerTrend,
      Icon: Headphones,
    },
    {
      label: 'Followers',
      value: metrics.spotifyFollowers.toLocaleString(),
      trend: getPaceTrend(metrics.spotifyFollowers, 35, monthProgress),
      Icon: Users,
    },
    {
      label: 'Top Single',
      value: metrics.topSingleStreams.toLocaleString(),
      trend: getPaceTrend(metrics.topSingleStreams, 60, monthProgress),
      Icon: Flame,
    },
  ];

  return (
    <div className="pb-6">
      {/* Centered Hero: Monthly Listeners + Goal Progress */}
      <section className="flex min-h-[calc(100dvh-10.5rem)] flex-col items-center justify-center px-2">
        <div className="w-full max-w-[320px] rounded-[28px] bg-[#1B1E24] px-7 py-9 text-center">
          <div className="text-7xl font-bold tracking-tight text-[#E3E2E6] tabular-nums">
            {metrics.monthlyListeners.toLocaleString()}
          </div>
          <div className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
            <span>Monthly Listeners</span>
            <TrendArrow trend={listenerTrend} />
          </div>

          <div className="mt-7 border-t border-white/5 pt-6">
            <div className="grid grid-cols-6 gap-2">
              {monthSegments.map((seg) => (
                <div key={seg.label} className="flex flex-col items-center gap-2">
                  <div
                    className={`relative flex h-20 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#111318] transition-all duration-500 ${
                      seg.isCompleted
                        ? 'ring-1 ring-[#6DD58C]/40 shadow-[0_0_16px_rgba(109,213,140,0.22)]'
                        : seg.isCurrent
                          ? 'ring-1 ring-white/10 shadow-[0_0_14px_rgba(168,199,250,0.12)]'
                          : 'ring-1 ring-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-out ${
                        seg.isCompleted
                          ? 'bg-[#6DD58C]/30'
                          : seg.isCurrent
                            ? 'bg-gradient-to-t from-[#6DD58C]/35 to-[#6DD58C]/10'
                            : 'bg-[#A8C7FA]/15'
                      }`}
                      style={{ height: `${seg.fillPct}%` }}
                    />
                    <span
                      className={`relative z-10 text-[10px] font-semibold tracking-tight tabular-nums transition-colors duration-300 ${
                        seg.isCompleted
                          ? 'text-[#6DD58C]'
                          : seg.isCurrent
                            ? 'text-[#E3E2E6]'
                            : 'text-zinc-500'
                      }`}
                    >
                      {formatCompactGoal(seg.goal)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-wider uppercase transition-colors duration-300 ${
                      seg.isCompleted
                        ? 'text-[#6DD58C]'
                        : seg.isCurrent
                          ? 'text-[#E3E2E6]'
                          : 'text-zinc-600'
                    }`}
                  >
                    {seg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Down: Monthly Metrics Grouped by Platform */}
      <section className="mx-auto w-full max-w-[360px] space-y-3 px-2 pt-2">
        <div className="text-center text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
          {monthLabel}
        </div>

        {/* Instagram Metrics */}
        <div className="rounded-[28px] bg-[#1B1E24] p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Instagram className="h-3.5 w-3.5 text-[#F472B6]" />
              <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
                Instagram
              </span>
            </div>
            <span className="text-[10px] font-medium text-zinc-500">
              @officiallxgmusic
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {instagramMetrics.map((item) => (
              <MetricTile key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Spotify Metrics */}
        <div className="rounded-[28px] bg-[#1B1E24] p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Disc3 className="h-3.5 w-3.5 text-[#6DD58C]" />
              <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
                Spotify
              </span>
            </div>
            <button
              type="button"
              onClick={openSpotifyDrawer}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition hover:bg-white/10 active:scale-95"
            >
              <Pencil className="h-2.5 w-2.5 text-[#6DD58C]" />
              <span>Update</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {spotifyMetrics.map((item) => (
              <MetricTile key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Auto-Computed "What's Working" Insights */}
        {whatsWorking && (
          <div className="rounded-[28px] bg-[#1B1E24] p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#A8C7FA]" />
                <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
                  What&apos;s Working
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-500">
                Auto-ranked
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#111318]/70 px-3.5 py-2.5">
                <span className="text-zinc-400">Top Hook</span>
                <span className="truncate font-medium text-[#E3E2E6]">
                  &ldquo;{whatsWorking.topHook}&rdquo;
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#111318]/70 px-3.5 py-2.5">
                <span className="text-zinc-400">Best Format</span>
                <span className="truncate font-medium text-[#A8C7FA]">
                  {whatsWorking.topFormat}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#111318]/70 px-3.5 py-2.5">
                <span className="text-zinc-400">Top Track</span>
                <span className="font-medium text-[#6DD58C]">
                  {whatsWorking.topTrack} ({whatsWorking.topEngagement.toFixed(1)}% ER)
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* One-Tap Spotify Quick Update Drawer */}
      {spotifyDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSpotifyDrawerOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveSpotifyDrawer}
            className="w-full max-w-[430px] rounded-t-[28px] border-t border-white/10 bg-[#1B1E24] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-[#6DD58C]" />
                <h2 className="text-sm font-semibold text-[#E3E2E6]">
                  Quick Update Spotify
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSpotifyDrawerOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] text-zinc-400">Monthly Listeners</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftSpotify.monthlyListeners}
                  onChange={(e) =>
                    setDraftSpotify((d) => ({ ...d, monthlyListeners: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-[#E3E2E6] outline-none focus:border-[#6DD58C]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-zinc-400">All-Time Streams</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftSpotify.allTimeStreams}
                  onChange={(e) =>
                    setDraftSpotify((d) => ({ ...d, allTimeStreams: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-[#E3E2E6] outline-none focus:border-[#6DD58C]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-zinc-400">Top Single Streams</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftSpotify.topSingleStreams}
                  onChange={(e) =>
                    setDraftSpotify((d) => ({ ...d, topSingleStreams: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-[#E3E2E6] outline-none focus:border-[#6DD58C]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-zinc-400">Catalog Releases</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={draftSpotify.catalogReleases}
                  onChange={(e) =>
                    setDraftSpotify((d) => ({ ...d, catalogReleases: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2 text-sm text-[#E3E2E6] outline-none focus:border-[#6DD58C]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#6DD58C] px-4 py-2.5 text-xs font-semibold text-[#0B120D] transition active:scale-[0.99]"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save Spotify Stats</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
