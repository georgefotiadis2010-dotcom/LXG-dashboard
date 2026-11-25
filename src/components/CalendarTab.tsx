import React from 'react';
import { useLxg } from '../context/LxgContext';

const TIMELINE_MILESTONES = [
  {
    id: 'iknow',
    title: "'I KNOW' Release",
    date: 'Nov 27, 2026',
    badge: 'UPCOMING',
    detail: 'Target: 120 7d streams / 50 7d listeners · Landr Pre-save live',
  },
  {
    id: 'radar',
    title: 'Release Radar Window',
    date: 'Dec 4, 2026',
    badge: 'ALGO',
    detail: '7-day Spotify algorithmic push window for followers & saves',
  },
  {
    id: 'watch',
    title: "'WATCH' Waterfall Single",
    date: 'Jan 2027',
    badge: 'SCHEDULED',
    detail: 'Follow-up waterfall release leveraging top-performing studio hook',
  },
  {
    id: 'unearthed',
    title: 'triple j Unearthed High',
    date: 'Mar – May 2027',
    badge: 'TARGET',
    detail: '3-track portfolio submission window for Australian high schoolers',
  },
];

export const CalendarTab: React.FC = () => {
  const { state, toggleChecklistItem } = useLxg();

  const completedCount = state.checklist.filter((c) => c.completed).length;

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white">
          Release Calendar
        </h2>
        <p className="text-xs text-zinc-400">
          Active execution timeline · Melbourne, AU
        </p>
      </div>

      {/* Release Timeline */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
          2026–2027 Rollout
        </h3>
        <div className="relative space-y-4 border-l border-white/10 pl-4">
          {TIMELINE_MILESTONES.map((item, idx) => (
            <div key={item.id} className="relative">
              <span
                className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#121216] ${
                  idx === 0 ? 'bg-[#EF4444]' : 'bg-zinc-500'
                }`}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {item.title}
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                  {item.date}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining Launch Checklist */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Remaining Launch Checklist
          </h3>
          <span className="text-xs font-semibold text-[#EF4444]">
            {completedCount}/{state.checklist.length} done
          </span>
        </div>

        <div className="space-y-2">
          {state.checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklistItem(item.id)}
              className="flex w-full items-start gap-3 rounded-lg border border-white/[0.06] bg-[#09090B] p-3 text-left transition hover:border-white/15"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                  item.completed
                    ? 'border-[#EF4444] bg-[#DC2626] text-white'
                    : 'border-zinc-600 bg-transparent text-transparent'
                }`}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-medium ${
                    item.completed
                      ? 'text-zinc-500 line-through'
                      : 'text-zinc-100'
                  }`}
                >
                  {item.title}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-400">
                    {item.category}
                  </span>
                  <span>Due {item.dueDate}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
