import React, { useState } from 'react';
import { METRIC_TARGETS, useLxg } from '../context/LxgContext';
import type { LxgMetrics, MetricKey } from '../types/lxg';

type GoalMode = 'target2027' | 'labelReadyRadar';

interface GoalRowConfig {
  key: MetricKey;
  label: string;
}

const GOAL_ROWS: GoalRowConfig[] = [
  { key: 'monthlyListeners', label: 'Monthly Listeners' },
  { key: 'allTimeStreams', label: 'All-Time Streams' },
  { key: 'topSingleStreams', label: 'Top Single Streams' },
  { key: 'instagramFollowers', label: 'Instagram Followers' },
  { key: 'topReelViews', label: 'Top Reel Views' },
  { key: 'catalogReleases', label: 'Catalog Releases' },
];

const SPOTIFY_EDITABLE_KEYS: MetricKey[] = [
  'monthlyListeners',
  'allTimeStreams',
  'topSingleStreams',
  'catalogReleases',
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
    catalogReleases: String(metrics.catalogReleases),
  });

  const openDrawer = () => {
    setDraft({
      monthlyListeners: String(metrics.monthlyListeners),
      allTimeStreams: String(metrics.allTimeStreams),
      topSingleStreams: String(metrics.topSingleStreams),
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
      catalogReleases: parseNonNeg(
        draft.catalogReleases,
        metrics.catalogReleases
      ),
    };

    updateMetrics(patch);
    setDrawerOpen(false);
  };

  const barColor = mode === 'target2027' ? 'bg-[#6DD58C]' : 'bg-[#A8C7FA]';

  return (
    <div className="mx-auto w-full max-w-[360px] space-y-4 px-2 pt-2 pb-8">
      {/* Header + Update CTA */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
            {mode === 'target2027' ? '2027 Horizon' : 'A&R Radar'}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-500 tabular-nums">
            Portfolio {metrics.overallPortfolioProgress.toFixed(1)}%
          </p>
        </div>
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-full bg-[#232730] px-3.5 py-1.5 text-[11px] font-medium text-[#E3E2E6] transition hover:bg-[#2C313C] active:scale-95"
        >
          Update
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-[#1B1E24] p-1">
        <button
          type="button"
          onClick={() => setMode('target2027')}
          className={`rounded-full py-2 text-[11px] font-semibold transition ${
            mode === 'target2027'
              ? 'bg-[#232730] text-[#E3E2E6]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          2027 Targets
        </button>
        <button
          type="button"
          onClick={() => setMode('labelReadyRadar')}
          className={`rounded-full py-2 text-[11px] font-semibold transition ${
            mode === 'labelReadyRadar'
              ? 'bg-[#232730] text-[#E3E2E6]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          A&amp;R Radar
        </button>
      </div>

      {/* Goal Progress Card */}
      <div className="space-y-4 rounded-[28px] bg-[#1B1E24] p-5">
        {GOAL_ROWS.map((row) => {
          const current = metrics[row.key];
          const target = METRIC_TARGETS[row.key][mode];
          const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

          return (
            <div key={row.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-400">{row.label}</span>
                <span className="font-semibold text-[#E3E2E6] tabular-nums">
                  {current.toLocaleString()}{' '}
                  <span className="font-normal text-zinc-500">
                    / {target.toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111318]">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-[430px] rounded-t-[28px] bg-[#1B1E24] p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-700" />
            <h3 className="text-sm font-semibold text-[#E3E2E6]">
              Update Spotify Numbers
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Instagram metrics sync automatically and are read-only.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {GOAL_ROWS.filter((row) =>
                SPOTIFY_EDITABLE_KEYS.includes(row.key)
              ).map((row) => (
                <label key={row.key} className="block">
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                    {row.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={draft[row.key as keyof typeof draft]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [row.key]: e.target.value }))
                    }
                    className="mt-1.5 w-full rounded-2xl bg-[#111318] px-3.5 py-2.5 text-sm font-medium text-[#E3E2E6] tabular-nums focus:ring-1 focus:ring-white/20 focus:outline-none"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-full bg-[#232730] py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#2C313C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-[#E3E2E6] py-2.5 text-xs font-semibold text-[#111318] transition hover:bg-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;
