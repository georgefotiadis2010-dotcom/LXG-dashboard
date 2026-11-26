import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useLxg } from '../context/LxgContext';

export const AccountTab: React.FC = () => {
  const {
    state,
    toggleSchoolMode,
    updateSyncSettings,
    syncNow,
    syncStatus,
  } = useLxg();

  const [webAppUrl, setWebAppUrl] = useState(state.syncSettings.webAppUrl);
  const [secretKey, setSecretKey] = useState(state.syncSettings.secretKey);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSyncSettings({
      webAppUrl: webAppUrl.trim(),
      secretKey: secretKey.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    await syncNow();
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lxg-command-snapshot-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor =
    syncStatus === 'success'
      ? 'text-[#6DD58C]'
      : syncStatus === 'error'
        ? 'text-[#F2B8B5]'
        : 'text-zinc-400';

  return (
    <div className="mx-auto w-full max-w-[360px] space-y-3 px-2 pt-2 pb-6">
      {/* Header */}
      <div className="px-1 text-center">
        <div className="text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
          Account &amp; Studio
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          LXG (@officiallxgmusic) · Melbourne, AU
        </p>
      </div>

      {/* Spreadsheet Snapshot: Core Catalog & Reach Metrics */}
      <div className="rounded-[28px] bg-[#1B1E24] p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#A8C7FA]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
              Spreadsheet Snapshot
            </span>
          </div>
          <span className="text-[10px] font-medium text-zinc-500">
            Live Totals
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              All-Time Streams
            </span>
            <span className="mt-1 text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
              {state.metrics.allTimeStreams.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-[#14171C]/60 px-2 py-3 text-center">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Catalog Releases
            </span>
            <span className="mt-1 text-lg font-bold tracking-tight text-[#E3E2E6] tabular-nums">
              {state.metrics.catalogReleases.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Google Sheets Bridge Settings */}
      <form
        onSubmit={handleSaveAndTest}
        className="space-y-3 rounded-[28px] bg-[#1B1E24] p-5"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-[#6DD58C]" />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
              Sheets Bridge
            </span>
          </div>
          <span className={`text-[10px] font-semibold uppercase ${statusColor}`}>
            {syncStatus}
          </span>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="mb-1 block text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Apps Script Web App URL
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              className="w-full rounded-2xl bg-[#14171C]/80 px-3.5 py-2.5 text-xs text-[#E3E2E6] placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#A8C7FA]/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Secret Sync Key
            </label>
            <input
              type="password"
              placeholder="Enter SYNC_KEY"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full rounded-2xl bg-[#14171C]/80 px-3.5 py-2.5 text-xs text-[#E3E2E6] placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#A8C7FA]/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#E3E2E6] py-2.5 text-xs font-semibold text-[#111318] transition hover:bg-white"
        >
          {savedNotice ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Saved &amp; Syncing...</span>
            </>
          ) : (
            <span>Test &amp; Sync Now</span>
          )}
        </button>

        {state.syncSettings.lastSyncedAt && (
          <p className="text-center text-[10px] text-zinc-500">
            Last synced{' '}
            {new Date(state.syncSettings.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </form>

      {/* School / Exam Mode Toggle */}
      <div className="flex items-center justify-between rounded-[28px] bg-[#1B1E24] p-5">
        <div className="flex items-start gap-3 pr-3">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div>
            <div className="text-xs font-semibold text-[#E3E2E6]">
              School / Exam Mode
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Reduced posting &amp; studio cadence
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSchoolMode}
          aria-pressed={state.schoolMode}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            state.schoolMode ? 'bg-[#6DD58C]' : 'bg-[#14171C]'
          }`}
        >
          <span
            className={`block h-5 w-5 translate-y-0.5 rounded-full bg-[#E3E2E6] transition ${
              state.schoolMode ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Export JSON Snapshot */}
      <button
        type="button"
        onClick={handleExportJson}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[28px] bg-[#1B1E24] py-3.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#232730] hover:text-[#E3E2E6]"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export JSON Snapshot</span>
      </button>
    </div>
  );
};
