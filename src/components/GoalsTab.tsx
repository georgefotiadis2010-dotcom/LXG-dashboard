import React, { useState } from 'react';
import { METRIC_TARGETS, useLxg } from '../context/LxgContext';
import type { LxgMetrics, MetricKey } from '../types/lxg';

type GoalMode = 'target2027' | 'labelReadyRadar';

interface GoalRowConfig {
  key: MetricKey;
  label: string;
  subtitle: string;
}

const GOAL_ROWS: GoalRowConfig[] = [
  {
    key: 'monthlyListeners',
    label: 'Monthly Spotify Listeners',
    subtitle: 'Current listeners vs. 2027 / A&R threshold',
  },
  {
    key: 'allTimeStreams',
    label: 'All-Time Catalog Streams',
    subtitle: 'Cumulative streams across all releases',
  },
  {
    key: 'topSingleStreams',
    label: 'Top Single Streams',
    subtitle: 'Best Thing (28d) / breakout single',
  },
  {
    key: 'instagramFollowers',
    label: 'Instagram Followers',
    subtitle: '@officiallxgmusic audience growth',
  },
  {
    key: 'topReelViews',
    label: 'Top Single Reel Views',
    subtitle: 'Highest-performing short-form hook',
  },
  {
    key: 'catalogReleases',
    label: 'Catalog Releases',
    subtitle: 'Active singles & waterfall drops',
  },
];

export const GoalsTab: React.FC = () => {
  const { state, updateMetrics } = useLxg();
  const { metrics } = state;

  const [mode, setMode] = useState<GoalMode>('target2027');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [draft, setDraft] = useState({
    monthlyListeners: String(metrics.monthlyListeners),
    allTimeStreams: String(metrics.allTimeStreams),
    topSingleStreams: String(metrics.topSingleStreams),
    instagramFollowers: String(metrics.instagramFollowers),
    topReelViews: String(metrics.topReelViews),
    catalogReleases: String(metrics.catalogReleases),
  });

  const openDrawer = () => {
    setDraft({
      monthlyListeners: String(metrics.monthlyListeners),
      allTimeStreams: String(metrics.allTimeStreams),
      topSingleStreams: String(metrics.topSingleStreams),
      instagramFollowers: String(metrics.instagramFollowers),
      topReelViews: String(metrics.topReelViews),
      catalogReleases: String(metrics.catalogReleases),
    });
    setDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parseNonNeg = (val: string, fallback: number) => {
      const n = Number(val);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
    };

    const patch: Partial<LxgMetrics> = {
      monthlyListeners: parseNonNeg(
        draft.monthlyListeners,
        metrics.monthlyListeners
      ),
      allTimeStreams: parseNonNeg(draft.allTimeStreams, metrics.allTimeStreams),
      topSingleStreams: parseNonNeg(
        draft.topSingleStreams,
        metrics.topSingleStreams
      ),
      instagramFollowers: parseNonNeg(
        draft.instagramFollowers,
        metrics.instagramFollowers
      ),
      topReelViews: parseNonNeg(draft.topReelViews, metrics.topReelViews),
      catalogReleases: parseNonNeg(
        draft.catalogReleases,
        metrics.catalogReleases
      ),
    };

    updateMetrics(patch);
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Mode Switcher */}
      <div
        className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#121216] p-1.5"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          type="button"
          onClick={() => setMode('target2027')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            mode === 'target2027'
              ? 'bg-[#DC2626] text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          2027 Step 1 Targets
        </button>
        <button
          type="button"
          onClick={() => setMode('labelReadyRadar')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            mode === 'labelReadyRadar'
              ? 'bg-[#DC2626] text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Label-Ready A&amp;R Radar
        </button>
      </div>

      {/* Header + Update Live Numbers CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">
            {mode === 'target2027'
              ? 'Dec 20, 2027 Horizon'
              : 'A&R Radar Thresholds'}
          </h2>
          <p className="text-[11px] text-zinc-400">
            Overall Portfolio: {metrics.overallPortfolioProgress.toFixed(1)}%
          </p>
        </div>
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-xl bg-[#DC2626] px-3.5 py-2 text-xs font-bold text-white shadow active:scale-95"
        >
          Update Live Numbers
        </button>
      </div>

      {/* Progress Cards */}
      <div className="space-y-3">
        {GOAL_ROWS.map((row) => {
          const current = metrics[row.key];
          const target = METRIC_TARGETS[row.key][mode];
          const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

          return (
            <div
              key={row.key}
              className="rounded-2xl bg-[#121216] p-4"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{row.label}</div>
                  <div className="text-[10px] text-zinc-500">{row.subtitle}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-white">
                    {current.toLocaleString()}{' '}
                    <span className="text-zinc-500">
                      / {target.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#EF4444]">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#09090B] border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] transition-all duration-300"
                  style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Update Live Numbers Slide-Up Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-[430px] rounded-t-3xl bg-[#121216] p-5 pb-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
            <h3 className="text-base font-bold text-white">
              Update Live Numbers
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Recalculates all 2027 &amp; A&amp;R progress bars immediately.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Monthly Listeners
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.monthlyListeners}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, monthlyListeners: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  All-Time Streams
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.allTimeStreams}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, allTimeStreams: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Top Track Streams
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.topSingleStreams}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, topSingleStreams: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  IG Followers
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.instagramFollowers}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      instagramFollowers: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Top Reel Views
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.topReelViews}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, topReelViews: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Catalog Releases
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.catalogReleases}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, catalogReleases: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl bg-[#09090B] px-3 py-2 font-mono text-sm text-white border border-white/10 focus:border-[#DC2626] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#DC2626] py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Save Numbers
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;
