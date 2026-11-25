import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  Clapperboard,
  CalendarDays,
  UserCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  Flame,
  Sparkles,
} from 'lucide-react';
import { LxgProvider, useLxg } from './context/LxgContext';
import DashboardTab from './components/DashboardTab';
import GoalsTab from './components/GoalsTab';
import { ContentTab } from './components/ContentTab';
import { CalendarTab } from './components/CalendarTab';
import { AccountTab } from './components/AccountTab';

type TabId = 'dashboard' | 'goals' | 'content' | 'calendar' | 'account';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'content', label: 'Content', icon: Clapperboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'account', label: 'Account', icon: UserCircle2 },
];

function SyncStatusPill() {
  const { syncStatus, syncNow } = useLxg();

  const statusConfig = {
    success: {
      label: 'Synced',
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/10',
      Icon: Wifi,
    },
    syncing: {
      label: 'Syncing...',
      dot: 'bg-amber-400 animate-pulse',
      text: 'text-amber-300',
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/10',
      Icon: RefreshCw,
    },
    error: {
      label: 'Offline',
      dot: 'bg-red-500',
      text: 'text-red-300',
      border: 'border-red-500/25',
      bg: 'bg-red-500/10',
      Icon: WifiOff,
    },
    idle: {
      label: 'Local Only',
      dot: 'bg-zinc-400',
      text: 'text-zinc-300',
      border: 'border-white/10',
      bg: 'bg-white/5',
      Icon: HardDrive,
    },
  }[syncStatus];

  const { label, dot, text, border, bg } = statusConfig;

  return (
    <button
      type="button"
      onClick={() => syncNow?.()}
      title="Sync Now"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${bg} ${border} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
      <RefreshCw
        className={`h-3 w-3 opacity-75 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
      />
    </button>
  );
}

function CommandShell() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { state, toggleOrganicMode } = useLxg();

  const isOrganic = state.organicMode;

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-100 flex justify-center">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[#09090B] sm:border-x sm:border-white/[0.08]">
        {/* Top Status Header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#09090B]/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#DC2626] shadow-[0_0_8px_#EF4444]" />
                <h1 className="truncate text-sm font-black tracking-tight text-white">
                  LXG <span className="font-semibold text-zinc-400">(@officiallxgmusic)</span>
                </h1>
              </div>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                Pop Rap · Melbourne, AU
              </p>
            </div>

            <SyncStatusPill />
          </div>

          {/* Organic vs. Raw Spike Toggle Pill */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Growth view mode"
              className="inline-flex w-full rounded-lg border border-white/[0.08] bg-[#121216] p-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  if (!isOrganic) toggleOrganicMode();
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  isOrganic
                    ? 'bg-[#DC2626] text-white shadow-[0_0_12px_rgba(220,38,38,0.35)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Organic</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isOrganic) toggleOrganicMode();
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  !isOrganic
                    ? 'bg-[#DC2626] text-white shadow-[0_0_12px_rgba(220,38,38,0.35)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Raw Spike</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'account' && <AccountTab />}
        </main>

        {/* Fixed Bottom Navigation Bar */}
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-0 z-30 w-full max-w-[430px] border-t border-white/[0.08] bg-[#09090B]/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md"
        >
          <div className="grid grid-cols-5 gap-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition ${
                    active
                      ? 'text-[#EF4444]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition ${
                      active ? 'text-[#EF4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : ''
                    }`}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LxgProvider>
      <CommandShell />
    </LxgProvider>
  );
}
