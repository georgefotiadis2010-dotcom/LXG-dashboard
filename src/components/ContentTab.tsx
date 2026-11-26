import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Clapperboard,
  Eye,
  Heart,
  MessageCircle,
  Percent,
  Share2,
  X,
} from 'lucide-react';
import { useLxg } from '../context/LxgContext';
import type { ReelEntry } from '../types/lxg';

type FilterKey = 'ALL' | 'TOP_SHARES';

export const ContentTab: React.FC = () => {
  const { state } = useLxg();
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selectedReel, setSelectedReel] = useState<ReelEntry | null>(null);

  const filteredReels = useMemo(() => {
    const list = [...state.reels];
    if (filter === 'TOP_SHARES') {
      return list.sort((a, b) => b.shares - a.shares);
    }
    return list;
  }, [state.reels, filter]);

  const totalViews = useMemo(
    () => state.reels.reduce((sum, r) => sum + r.views, 0),
    [state.reels]
  );

  const avgEr = useMemo(() => {
    if (state.reels.length === 0) return 0;
    const sum = state.reels.reduce((acc, r) => acc + r.engagementRate, 0);
    return Number((sum / state.reels.length).toFixed(1));
  }, [state.reels]);

  return (
    <div className="mx-auto w-full max-w-[360px] space-y-4 px-2 pb-6">
      {/* Header */}
      <div className="pt-1">
        <h2 className="text-lg font-bold tracking-tight text-[#E3E2E6]">
          Content
        </h2>
        <p className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
          Reels Performance
        </p>
      </div>

      {/* Overview Card */}
      <div className="rounded-[28px] bg-[#1B1E24] p-5">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
            <Eye className="h-3.5 w-3.5 text-zinc-400" />
            <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Views
            </span>
            <span className="mt-0.5 text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
              {totalViews.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
            <Clapperboard className="h-3.5 w-3.5 text-zinc-400" />
            <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Reels
            </span>
            <span className="mt-0.5 text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
              {state.reels.length}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
            <Percent className="h-3.5 w-3.5 text-zinc-400" />
            <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Avg ER
            </span>
            <span className="mt-0.5 text-lg font-bold tracking-tight text-[#6DD58C] tabular-nums">
              {avgEr}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { key: 'ALL', label: 'All' },
            { key: 'TOP_SHARES', label: 'Top Shares' },
          ] as const
        ).map((pill) => {
          const active = filter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-[#E3E2E6] text-[#111318]'
                  : 'bg-[#1B1E24] text-zinc-400 hover:text-[#E3E2E6]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Reels List */}
      <div className="space-y-3">
        {filteredReels.map((reel) => (
          <button
            key={reel.id}
            type="button"
            onClick={() => setSelectedReel(reel)}
            className="w-full rounded-[28px] bg-[#1B1E24] p-5 text-left transition hover:bg-[#232730] active:scale-[0.99]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#14171C]/80 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300 uppercase">
                  {reel.track}
                </span>
                <span className="text-[11px] text-zinc-500 tabular-nums">
                  {reel.date}
                </span>
              </div>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  reel.engagementRate >= 6
                    ? 'text-[#6DD58C]'
                    : 'text-zinc-300'
                }`}
              >
                {reel.engagementRate}% ER
              </span>
            </div>

            <p className="line-clamp-2 text-sm font-medium leading-snug text-[#E3E2E6]">
              &ldquo;{reel.hook}&rdquo;
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {reel.visualFormat}
            </p>

            {/* Core Metrics: Views, Shares, Saves */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl bg-[#14171C]/60 px-3 py-2.5 text-center">
              <div>
                <div className="text-sm font-bold text-[#E3E2E6] tabular-nums">
                  {reel.views.toLocaleString()}
                </div>
                <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Views
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-sm font-bold text-[#E3E2E6] tabular-nums">
                  <Share2 className="h-3 w-3 text-zinc-400" />
                  <span>{reel.shares}</span>
                </div>
                <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Shares
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#E3E2E6] tabular-nums">
                  {reel.saves}
                </div>
                <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Saves
                </div>
              </div>
            </div>

            {(reel.note || reel.flag) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {reel.note && (
                  <span className="rounded-full bg-[#6DD58C]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#6DD58C]">
                    {reel.note}
                  </span>
                )}
                {reel.flag && (
                  <span className="rounded-full bg-[#F2B8B5]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#F2B8B5]">
                    {reel.flag}
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Reel Detail Drawer */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setSelectedReel(null)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] border-t border-white/5 bg-[#1B1E24] p-5 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#14171C] px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300 uppercase">
                  {selectedReel.track}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums">
                  {selectedReel.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReel(null)}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-[#E3E2E6]"
                aria-label="Close detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formatted Caption / Hook */}
            <div className="rounded-2xl bg-[#14171C]/70 p-4">
              <div className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
                Caption / Hook
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed font-medium text-[#E3E2E6]">
                {selectedReel.hook}
              </p>
              {selectedReel.visualFormat && (
                <div className="mt-3 border-t border-white/5 pt-2.5 text-xs text-zinc-400">
                  <span className="text-zinc-500">Format: </span>
                  {selectedReel.visualFormat}
                </div>
              )}
            </div>

            {/* Full Metrics Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <Eye className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Views
                </span>
                <span className="mt-0.5 text-base font-bold text-[#E3E2E6] tabular-nums">
                  {selectedReel.views.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <Heart className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Likes
                </span>
                <span className="mt-0.5 text-base font-bold text-[#E3E2E6] tabular-nums">
                  {selectedReel.likes.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <MessageCircle className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Comments
                </span>
                <span className="mt-0.5 text-base font-bold text-[#E3E2E6] tabular-nums">
                  {selectedReel.comments.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <Share2 className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Shares
                </span>
                <span className="mt-0.5 text-base font-bold text-[#E3E2E6] tabular-nums">
                  {selectedReel.shares.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Saves
                </span>
                <span className="mt-0.5 text-base font-bold text-[#E3E2E6] tabular-nums">
                  {selectedReel.saves.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
                <Percent className="h-3.5 w-3.5 text-zinc-400" />
                <span className="mt-1.5 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Eng. Rate
                </span>
                <span
                  className={`mt-0.5 text-base font-bold tabular-nums ${
                    selectedReel.engagementRate >= 6
                      ? 'text-[#6DD58C]'
                      : 'text-[#E3E2E6]'
                  }`}
                >
                  {selectedReel.engagementRate}%
                </span>
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-zinc-500">
              Note: IG reposts are not tracked by the API.
            </p>

            {(selectedReel.note || selectedReel.flag) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedReel.note && (
                  <span className="rounded-full bg-[#6DD58C]/10 px-3 py-1 text-[11px] font-medium text-[#6DD58C]">
                    {selectedReel.note}
                  </span>
                )}
                {selectedReel.flag && (
                  <span className="rounded-full bg-[#F2B8B5]/10 px-3 py-1 text-[11px] font-medium text-[#F2B8B5]">
                    {selectedReel.flag}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
