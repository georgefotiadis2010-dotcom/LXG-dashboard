import React, { useMemo, useState } from 'react';
import { useLxg } from '../context/LxgContext';
import type { ReelTrack } from '../types/lxg';

type FilterKey = 'ALL' | 'I KNOW' | 'WATCH' | 'TOP_SHARES';

export const ContentTab: React.FC = () => {
  const { state, addReel } = useLxg();
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [hook, setHook] = useState('');
  const [visualFormat, setVisualFormat] = useState('Person then DAW');
  const [track, setTrack] = useState<ReelTrack>('I KNOW');
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');

  const filteredReels = useMemo(() => {
    const list = [...state.reels];
    if (filter === 'I KNOW') {
      return list.filter((r) => r.track === 'I KNOW');
    }
    if (filter === 'WATCH') {
      return list.filter((r) => r.track === 'WATCH');
    }
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

  const parsedViews = Number(views) || 0;
  const parsedLikes = Number(likes) || 0;
  const parsedComments = Number(comments) || 0;
  const parsedShares = Number(shares) || 0;
  const parsedSaves = Number(saves) || 0;
  const previewEr =
    parsedViews > 0
      ? Number(
          (
            ((parsedLikes + parsedComments + parsedShares + parsedSaves) /
              parsedViews) *
            100
          ).toFixed(1)
        )
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hook.trim()) return;

    addReel({
      date: date || todayStr,
      hook: hook.trim(),
      visualFormat: visualFormat.trim() || 'Quick cut studio shots',
      track,
      views: parsedViews,
      likes: parsedLikes,
      comments: parsedComments,
      shares: parsedShares,
      saves: parsedSaves,
      engagementRate: previewEr,
    });

    setHook('');
    setViews('');
    setLikes('');
    setComments('');
    setShares('');
    setSaves('');
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header + Log New Reel CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Content Engine
          </h2>
          <p className="text-xs text-zinc-400">
            {state.reels.length} reels · {totalViews.toLocaleString()} views ·{' '}
            {avgEr}% avg ER
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(220,38,38,0.35)] transition hover:bg-[#EF4444] active:scale-95"
        >
          + Log New Reel
        </button>
      </div>

      {/* Pinned Hook & Timing Rules Card */}
      <div className="rounded-xl border border-red-500/30 bg-[#121216] p-3.5 shadow-[0_0_20px_rgba(220,38,38,0.08)]">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444]">
            Pinned Hook &amp; Timing Rules
          </span>
          <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
            Data-Backed
          </span>
        </div>
        <ul className="space-y-1.5 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-white">POV / bedroom studio hooks</strong>{' '}
              hit <strong className="text-white">~880–1,212 views</strong> &amp;
              drive 89.5% non-follower reach.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
            <span>
              <strong className="text-white">7:30 AM posts</strong> (605 views,
              0 shares) &amp; hard{' '}
              <strong className="text-white">&quot;PRESAVE&quot;</strong> text
              (474 views) underperform — post afternoon/evening with story-first
              hooks.
            </span>
          </li>
        </ul>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { key: 'ALL', label: 'All Reels' },
            { key: 'I KNOW', label: 'I KNOW' },
            { key: 'WATCH', label: 'WATCH' },
            { key: 'TOP_SHARES', label: 'Top Shares' },
          ] as const
        ).map((pill) => {
          const active = filter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-[#EF4444] bg-[#DC2626]/20 text-white'
                  : 'border-white/10 bg-[#121216] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Reels List */}
      <div className="space-y-2.5">
        {filteredReels.map((reel) => (
          <div
            key={reel.id}
            className="rounded-xl border border-white/[0.08] bg-[#121216] p-3.5"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                  {reel.track}
                </span>
                <span className="text-[11px] text-zinc-500">{reel.date}</span>
              </div>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-[#EF4444]">
                {reel.engagementRate}% ER
              </span>
            </div>

            <p className="text-sm font-medium text-white">
              &ldquo;{reel.hook}&rdquo;
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {reel.visualFormat}
            </p>

            <div className="mt-3 grid grid-cols-5 gap-1.5 rounded-lg bg-[#09090B] p-2 text-center">
              <div>
                <div className="text-xs font-bold text-white">
                  {reel.views.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500">Views</div>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{reel.likes}</div>
                <div className="text-[10px] text-zinc-500">Likes</div>
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {reel.comments}
                </div>
                <div className="text-[10px] text-zinc-500">Cmts</div>
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {reel.shares}
                </div>
                <div className="text-[10px] text-zinc-500">Shares</div>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{reel.saves}</div>
                <div className="text-[10px] text-zinc-500">Saves</div>
              </div>
            </div>

            {(reel.note || reel.flag) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {reel.note && (
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                    {reel.note}
                  </span>
                )}
                {reel.flag && (
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                    {reel.flag}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Slide-up Log New Reel Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-[430px] rounded-t-2xl border-t border-white/10 bg-[#121216] p-4 pb-8 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Log New Reel</h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-2.5 py-2 text-xs text-white focus:border-[#EF4444] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Song
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as ReelTrack)}
                    className="w-full rounded-lg border border-white/10 bg-[#09090B] px-2.5 py-2 text-xs text-white focus:border-[#EF4444] focus:outline-none"
                  >
                    <option value="I KNOW">I KNOW</option>
                    <option value="WATCH">WATCH</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Hook Text
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pov: 16 yr old twins in a bedroom studio.."
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-2.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#EF4444] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Visual Format
                </label>
                <input
                  type="text"
                  placeholder="Person then DAW / Car B-roll / Quick cut studio shots"
                  value={visualFormat}
                  onChange={(e) => setVisualFormat(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] px-2.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#EF4444] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Views', val: views, set: setViews },
                  { label: 'Likes', val: likes, set: setLikes },
                  { label: 'Cmts', val: comments, set: setComments },
                  { label: 'Shares', val: shares, set: setShares },
                  { label: 'Saves', val: saves, set: setSaves },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-1 block text-[10px] text-zinc-400">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={field.val}
                      onChange={(e) => field.set(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#09090B] px-2 py-1.5 text-xs text-white focus:border-[#EF4444] focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#09090B] px-3 py-2">
                <span className="text-xs text-zinc-400">
                  Auto-Calculated Engagement Rate
                </span>
                <span className="text-sm font-bold text-[#EF4444]">
                  {previewEr}%
                </span>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#DC2626] py-2.5 text-xs font-bold text-white transition hover:bg-[#EF4444]"
              >
                Save &amp; Prepend Reel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
