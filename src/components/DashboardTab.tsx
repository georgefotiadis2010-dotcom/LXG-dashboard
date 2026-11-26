import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clapperboard,
  Disc3,
  Eye,
  Flame,
  Headphones,
  Instagram,
  Percent,
  Users,
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
  const { state } = useLxg();
  const { metrics, reels } = state;

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

  const ultimateGoal = METRIC_TARGETS.monthlyListeners.labelReadyRadar;
  const monthlyPct = Math.min(
    100,
    Math.round((metrics.monthlyListeners / MONTHLY_LISTENER_GOAL) * 100)
  );
  const ultimatePct = Math.min(
    100,
    (metrics.monthlyListeners / ultimateGoal) * 100
  );

  const listenerTrend = getPaceTrend(
    metrics.monthlyListeners,
    MONTHLY_LISTENER_GOAL,
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

          <div className="mt-7 space-y-3.5 border-t border-white/5 pt-6 text-left">
            {/* Monthly Goal */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-400">Monthly Goal</span>
                <span className="font-semibold text-[#E3E2E6] tabular-nums">
                  {metrics.monthlyListeners.toLocaleString()} /{' '}
                  {MONTHLY_LISTENER_GOAL.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111318]">
                <div
                  className="h-full rounded-full bg-[#6DD58C] transition-all duration-500"
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
            </div>

            {/* Ultimate Goal */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-400">Ultimate Goal</span>
                <span className="font-semibold text-zinc-300 tabular-nums">
                  {metrics.monthlyListeners.toLocaleString()} /{' '}
                  {(ultimateGoal / 1000).toLocaleString()}k
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111318]">
                <div
                  className="h-full rounded-full bg-[#A8C7FA] transition-all duration-500"
                  style={{
                    width: `${
                      metrics.monthlyListeners > 0
                        ? Math.max(2, ultimatePct)
                        : 0
                    }%`,
                  }}
                />
              </div>
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
            <span className="text-[10px] font-medium text-zinc-500">
              Streaming
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {spotifyMetrics.map((item) => (
              <MetricTile key={item.label} {...item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardTab;
