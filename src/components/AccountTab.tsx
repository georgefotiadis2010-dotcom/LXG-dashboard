import React, { useState } from 'react';
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

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white">
          Account &amp; Studio Settings
        </h2>
        <p className="text-xs text-zinc-400">
          LXG (@officiallxgmusic) · Pop Rap · Melbourne, AU
        </p>
      </div>

      {/* Google Sheets Bridge Settings */}
      <form
        onSubmit={handleSaveAndTest}
        className="rounded-xl border border-white/[0.08] bg-[#121216] p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Google Sheets Bridge
          </h3>
          <span className="text-[11px] text-zinc-400">
            Status:{' '}
            <strong className="text-white uppercase">{syncStatus}</strong>
          </span>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-400">
            Apps Script Web App URL
          </label>
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#EF4444] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-400">
            Secret Sync Key
          </label>
          <input
            type="password"
            placeholder="Enter SYNC_KEY"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#EF4444] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#DC2626] py-2.5 text-xs font-bold text-white transition hover:bg-[#EF4444]"
        >
          {savedNotice ? 'Saved! Testing Sync...' : 'Test & Sync Now'}
        </button>

        {state.syncSettings.lastSyncedAt && (
          <p className="text-[10px] text-zinc-500">
            Last synced:{' '}
            {new Date(state.syncSettings.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </form>

      {/* School / Exam Mode Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#121216] p-4">
        <div className="pr-3">
          <div className="text-sm font-semibold text-white">
            School / Exam Mode
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Reduced posting &amp; studio schedule (started Nov 12, 2026)
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSchoolMode}
          aria-pressed={state.schoolMode}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            state.schoolMode ? 'bg-[#DC2626]' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition ${
              state.schoolMode ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Catalog Vault Summary + Export JSON */}
      <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Catalog Vault Summary
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[#09090B] p-2.5">
            <div className="text-base font-bold text-white">62</div>
            <div className="text-[10px] text-zinc-400">Rated Demos</div>
          </div>
          <div className="rounded-lg bg-[#09090B] p-2.5">
            <div className="text-base font-bold text-white">4</div>
            <div className="text-[10px] text-zinc-400">Multi-Track Stems</div>
          </div>
          <div className="rounded-lg bg-[#09090B] p-2.5">
            <div className="text-base font-bold text-white">37</div>
            <div className="text-[10px] text-zinc-400">Covers</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          className="w-full rounded-lg border border-white/15 bg-[#09090B] py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-white/30 hover:text-white"
        >
          Export JSON Snapshot
        </button>
      </div>
    </div>
  );
};
