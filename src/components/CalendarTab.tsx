import React from 'react';
import { Calendar, Check, CheckCircle2 } from 'lucide-react';
import { useLxg } from '../context/LxgContext';

export const CalendarTab: React.FC = () => {
  const { state, toggleChecklistItem } = useLxg();
  const { pipeline, checklist } = state;

  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="mx-auto w-full max-w-[360px] space-y-3 px-2 pb-6 pt-2">
      <div className="text-center text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
        Release Calendar
      </div>

      {/* Release Timeline */}
      <div className="rounded-[28px] bg-[#1B1E24] p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#A8C7FA]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
              Rollout
            </span>
          </div>
          <span className="text-[10px] font-medium text-zinc-500 tabular-nums">
            {pipeline.length} milestones
          </span>
        </div>

        <div className="space-y-2.5">
          {pipeline.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#14171C]/60 px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      idx === 0 ? 'bg-[#6DD58C]' : 'bg-zinc-600'
                    }`}
                  />
                  <span className="truncate text-sm font-semibold text-[#E3E2E6]">
                    {item.title}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-zinc-400 tabular-nums">
                  {item.dateLabel}
                </span>
              </div>
              <p className="mt-1 pl-4 text-[11px] leading-relaxed text-zinc-400">
                {item.targetSummary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Checklist */}
      <div className="rounded-[28px] bg-[#1B1E24] p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#6DD58C]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
              Checklist
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#6DD58C] tabular-nums">
            {completedCount}/{checklist.length}
          </span>
        </div>

        <div className="space-y-2">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleChecklistItem(item.id)}
              className="flex w-full items-start gap-3 rounded-2xl bg-[#14171C]/60 px-3.5 py-3 text-left transition-colors hover:bg-[#14171C]"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  item.completed
                    ? 'border-[#6DD58C] bg-[#6DD58C] text-[#111318]'
                    : 'border-zinc-600 bg-transparent text-transparent'
                }`}
              >
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-medium leading-snug ${
                    item.completed
                      ? 'text-zinc-500 line-through'
                      : 'text-[#E3E2E6]'
                  }`}
                >
                  {item.title}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span className="tabular-nums">{item.dueDate}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
