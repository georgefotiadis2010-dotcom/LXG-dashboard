import React from 'react';
import { Disc3, Eye, Flame, Instagram, Play, Users } from 'lucide-react';
import { METRIC_TARGETS, useLxg } from '../context/LxgContext';

const MONTHLY_GOAL = 50;

export const DashboardTab: React.FC = () => {
  const { state } = useLxg();
  const { metrics } = state;

  const ultimateGoal = METRIC_TARGETS.monthlyListeners.labelReadyRadar;
  const monthlyPct = Math.min(
    100,
    Math.round((metrics.monthlyListeners / MONTHLY_GOAL) * 100)
  );
  const ultimatePct = Math.min(
    100,
    (metrics.monthlyListeners / ultimateGoal) * 100
  );

  const otherMetrics = [
    {
      label: 'Followers',
      value: metrics.spotifyFollowers.toLocaleString(),
      Icon: Users,
    },
    {
      label: 'Streams',
      value: metrics.allTimeStreams.toLocaleString(),
      Icon: Play,
    },
    {
      label: 'Instagram',
      value: metrics.instagramFollowers.toLocaleString(),
      Icon: Instagram,
    },
    {
      label: 'Top Single',
      value: metrics.topSingleStreams.toLocaleString(),
      Icon: Flame,
    },
    {
      label: 'Top Reel',
      value: metrics.topReelViews.toLocaleString(),
      Icon: Eye,
    },
    {
      label: 'Releases',
      value: metrics.catalogReleases.toLocaleString(),
      Icon: Disc3,
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
          <div className="mt-1.5 text-[11px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
            Monthly Listeners
          </div>

          <div className="mt-7 space-y-3.5 border-t border-white/5 pt-6 text-left">
            {/* Monthly Goal */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-400">Monthly Goal</span>
                <span className="font-semibold text-[#E3E2E6] tabular-nums">
                  {metrics.monthlyListeners.toLocaleString()} / {MONTHLY_GOAL.toLocaleString()}
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

      {/* Scroll Down: All Other Metrics at a Single Glance */}
      <section className="px-2 pt-2">
        <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-[#1B1E24] p-5">
          <div className="mb-4 text-center text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
            Overview
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {otherMetrics.map(({ label, value, Icon }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  {label}
                </span>
                <span className="mt-0.5 text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardTab;
