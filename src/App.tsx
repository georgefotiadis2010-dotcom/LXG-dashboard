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

  return (
    <div className="min-h-screen w-full bg-[#111318] text-[#E3E2E6] flex justify-center">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col bg-[#111318]">
        {/* Top Minimal Material Header */}
        <header className="sticky top-0 z-30 bg-[#111318]/90 px-5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold tracking-tight text-[#E3E2E6]">
                  LXG
                </h1>
                <span className="rounded-full bg-[#1B1E24] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  @officiallxgmusic
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SyncStatusPill />
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-2 pb-28">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'account' && <AccountTab />}
        </main>

        {/* Material 3 Bottom Navigation Bar */}
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-0 z-30 w-full max-w-[430px] bg-[#16181E]/95 px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
        >
          <div className="grid grid-cols-5 gap-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className="group flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-all"
                >
                  <div
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-[#2A313D] text-[#E3E2E6]'
                        : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span
                    className={`transition-colors ${
                      active ? 'font-semibold text-[#E3E2E6]' : 'text-zinc-500'
                    }`}
                  >
                    {label}
                  </span>
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
