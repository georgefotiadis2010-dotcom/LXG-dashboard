import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchSheetState,
  isSyncConfigured,
  postSheetMutation,
  type SheetAction,
} from '../lib/sheetSync';
import type {
  LxgContextValue,
  LxgMetrics,
  LxgState,
  MetricKey,
  MetricTarget,
  NewReelInput,
  ReelEntry,
  SyncSettings,
  SyncStatus,
} from '../types/lxg';

export const STORAGE_KEY = 'lxg_command_state_v1';

export const METRIC_TARGETS: Record<MetricKey, MetricTarget> = {
  monthlyListeners: { target2027: 10_000, labelReadyRadar: 100_000 },
  allTimeStreams: { target2027: 20_000, labelReadyRadar: 2_000_000 },
  topSingleStreams: { target2027: 5_000, labelReadyRadar: 500_000 },
  instagramFollowers: { target2027: 1_000, labelReadyRadar: 10_000 },
  topReelViews: { target2027: 10_000, labelReadyRadar: 500_000 },
  catalogReleases: { target2027: 15, labelReadyRadar: 20 },
};

export const INITIAL_REELS: ReelEntry[] = [
  {
    id: 'reel-1',
    date: '2026-11-06',
    hook: 'studio lately..',
    visualFormat: 'Person then DAW',
    track: 'WATCH',
    views: 1212,
    likes: 54,
    comments: 3,
    shares: 34,
    saves: 4,
    engagementRate: 7.8,
    note: '#1 reach & share driver',
  },
  {
    id: 'reel-2',
    date: '2026-11-20',
    hook: 'pov: You are 16 and produced the track of the summer..',
    visualFormat: 'Quick cut studio shots',
    track: 'I KNOW',
    views: 894,
    likes: 42,
    comments: 2,
    shares: 17,
    saves: 0,
    engagementRate: 6.8,
    note: '89.5% non-follower reach',
  },
  {
    id: 'reel-3',
    date: '2026-11-11',
    hook: 'we 16 this drops 27th november',
    visualFormat: 'Car B-roll',
    track: 'I KNOW',
    views: 882,
    likes: 41,
    comments: 4,
    shares: 26,
    saves: 2,
    engagementRate: 8.3,
  },
  {
    id: 'reel-4',
    date: '2026-11-12',
    hook: 'so you found 16 yr old twins making this from a bedroom',
    visualFormat: 'Walking outside sideways',
    track: 'I KNOW',
    views: 759,
    likes: 31,
    comments: 0,
    shares: 15,
    saves: 2,
    engagementRate: 6.3,
  },
  {
    id: 'reel-5',
    date: '2026-11-08',
    hook: 'made this in our bedroom at 16',
    visualFormat: 'Car B-roll',
    track: 'I KNOW',
    views: 722,
    likes: 38,
    comments: 0,
    shares: 6,
    saves: 3,
    engagementRate: 6.5,
  },
  {
    id: 'reel-6',
    date: '2026-11-13',
    hook: 'pov you found this before november 27',
    visualFormat: 'Car B-roll',
    track: 'I KNOW',
    views: 710,
    likes: 30,
    comments: 0,
    shares: 4,
    saves: 1,
    engagementRate: 4.9,
  },
  {
    id: 'reel-7',
    date: '2026-11-14',
    hook: 'Be honest: skip or pre-save? Drops Nov 27.',
    visualFormat: 'Quick cut studio shots',
    track: 'I KNOW',
    views: 636,
    likes: 26,
    comments: 0,
    shares: 5,
    saves: 4,
    engagementRate: 5.5,
  },
  {
    id: 'reel-8',
    date: '2026-11-12',
    hook: '16 btw',
    visualFormat: 'Person then DAW',
    track: 'WATCH',
    views: 605,
    likes: 40,
    comments: 1,
    shares: 0,
    saves: 2,
    engagementRate: 7.1,
    flag: 'Posted 7:30 AM - avoid morning posts',
  },
  {
    id: 'reel-9',
    date: '2026-11-22',
    hook: '16 years old & I KNOW is next.. PRESAVE',
    visualFormat: 'Quick cut studio shots',
    track: 'I KNOW',
    views: 474,
    likes: 25,
    comments: 0,
    shares: 1,
    saves: 2,
    engagementRate: 5.5,
    flag: 'Hard "PRESAVE" text hurts reach',
  },
];

export const INITIAL_STATE: LxgState = {
  version: 1,
  horizonDate: 'Dec 20, 2027',
  schoolMode: false,
  metrics: {
    monthlyListeners: 40,
    spotifyFollowers: 32,
    allTimeStreams: 350,
    topSingleStreams: 59,
    topSingleName: 'Best Thing (28d)',
    instagramFollowers: 123,
    topReelViews: 1212,
    topReelName: 'studio lately..',
    catalogReleases: 2,
    activeReleaseNames: ['Best Thing', 'On Our Own'],
    overallPortfolioProgress: 6.5,
  },
  pipeline: [
    {
      id: 'rel-i-know',
      title: 'I KNOW',
      dateLabel: 'Friday, Nov 27, 2026',
      status: 'UPCOMING',
      strategy: 'Single Launch',
      targetSummary: 'Release Week target: 120 7d streams / 50 7d listeners',
      preSaveUrl: 'https://release.landr.com/991061532664',
      notes: 'Landr pre-save active. Avoid hard "PRESAVE" text & morning posts.',
    },
    {
      id: 'rel-watch',
      title: 'WATCH',
      dateLabel: 'January 2027',
      status: 'SCHEDULED',
      strategy: 'Waterfall release',
      targetSummary: 'Carry momentum from I KNOW into Jan 2027 waterfall',
      notes: '"studio lately.." (#1 reach & share driver) teases WATCH.',
    },
    {
      id: 'rel-unearthed',
      title: 'triple j Unearthed High',
      dateLabel: 'Mar–May 2027',
      status: 'TARGET',
      strategy: '3-track portfolio',
      targetSummary: 'Submit 3-track portfolio for Unearthed High window',
    },
  ],
  checklist: [
    {
      id: 'chk-iknow-canvas',
      title: 'Finalize Spotify Canvas & release-day story assets for I KNOW',
      category: 'I KNOW',
      dueDate: '2026-11-26',
      completed: false,
      priority: 'HIGH',
    },
    {
      id: 'chk-iknow-post-window',
      title: 'Schedule I KNOW drop-day Reel in peak evening window (no 7:30 AM posts)',
      category: 'I KNOW',
      dueDate: '2026-11-27',
      completed: false,
      priority: 'HIGH',
    },
    {
      id: 'chk-iknow-7d-review',
      title: 'Audit I KNOW 7-day target (120 streams / 50 listeners)',
      category: 'I KNOW',
      dueDate: '2026-12-04',
      completed: false,
      priority: 'MEDIUM',
    },
    {
      id: 'chk-watch-waterfall',
      title: 'Lock WATCH waterfall metadata & Landr distribution for Jan 2027',
      category: 'WATCH',
      dueDate: '2026-12-18',
      completed: false,
      priority: 'HIGH',
    },
    {
      id: 'chk-unearthed-portfolio',
      title: 'Select & sequence 3-track portfolio for triple j Unearthed High',
      category: 'UNEARTHED',
      dueDate: '2027-03-01',
      completed: false,
      priority: 'MEDIUM',
    },
  ],
  reels: INITIAL_REELS,
  syncSettings: {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbyk_G6mF_PbZkrrr7koOLor0L9PofmqFm1QRAtWC0717DXkfKzABXgGI9eNIVZHvk6L/exec',
    secretKey: 'lxg-2026-secret',
    autoSync: false,
    lastSyncedAt: null,
  },
};

function loadInitialState(): LxgState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<LxgState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      metrics: {
        ...INITIAL_STATE.metrics,
        ...(parsed.metrics ?? {}),
      },
      syncSettings: {
        ...INITIAL_STATE.syncSettings,
        ...(parsed.syncSettings ?? {}),
      },
      pipeline: Array.isArray(parsed.pipeline) ? parsed.pipeline : INITIAL_STATE.pipeline,
      checklist: Array.isArray(parsed.checklist) ? parsed.checklist : INITIAL_STATE.checklist,
      reels: Array.isArray(parsed.reels) ? parsed.reels : INITIAL_STATE.reels,
    };
  } catch {
    return INITIAL_STATE;
  }
}

const LxgContext = createContext<LxgContextValue | undefined>(undefined);

export const LxgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LxgState>(loadInitialState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [state]);

  const pushMutation = useCallback(async (action: SheetAction, payload: unknown) => {
    const { webAppUrl, secretKey } = stateRef.current.syncSettings;
    if (!isSyncConfigured(webAppUrl, secretKey)) {
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus('syncing');
    try {
      await postSheetMutation(webAppUrl, secretKey, action, payload);
      setState((prev) => ({
        ...prev,
        syncSettings: {
          ...prev.syncSettings,
          lastSyncedAt: new Date().toISOString(),
        },
      }));
      setSyncStatus('success');
    } catch {
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const incrementMetric = useCallback(
    (key: MetricKey, delta: number) => {
      const nextVal = Math.max(0, stateRef.current.metrics[key] + delta);
      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [key]: Math.max(0, prev.metrics[key] + delta),
        },
      }));
      void pushMutation('UPDATE_METRICS', { [key]: nextVal });
    },
    [pushMutation]
  );

  const updateMetrics = useCallback(
    (patch: Partial<LxgMetrics>) => {
      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          ...patch,
        },
      }));
      void pushMutation('UPDATE_METRICS', patch);
    },
    [pushMutation]
  );

  const addReel = useCallback((input: NewReelInput) => {
    const totalInteractions =
      input.likes + input.comments + input.shares + input.saves;
    const computedEr =
      input.engagementRate !== undefined
        ? input.engagementRate
        : input.views > 0
          ? Number(((totalInteractions / input.views) * 100).toFixed(1))
          : 0;

    const newReel: ReelEntry = {
      ...input,
      id: `reel-${Date.now()}`,
      engagementRate: computedEr,
    };

    setState((prev) => {
      const nextTopViews = Math.max(prev.metrics.topReelViews, newReel.views);
      const nextTopName =
        newReel.views > prev.metrics.topReelViews
          ? newReel.hook
          : prev.metrics.topReelName;

      return {
        ...prev,
        reels: [newReel, ...prev.reels],
        metrics: {
          ...prev.metrics,
          topReelViews: nextTopViews,
          topReelName: nextTopName,
        },
      };
    });
    void pushMutation('ADD_REEL', newReel);
  }, [pushMutation]);

  const toggleChecklistItem = useCallback(
    (id: string) => {
      const target = stateRef.current.checklist.find((item) => item.id === id);
      const nextCompleted = target ? !target.completed : true;
      setState((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        ),
      }));
      void pushMutation('TOGGLE_CHECKLIST', { id, completed: nextCompleted });
    },
    [pushMutation]
  );

  const toggleSchoolMode = useCallback(() => {
    setState((prev) => ({ ...prev, schoolMode: !prev.schoolMode }));
  }, []);

  const updateSyncSettings = useCallback((patch: Partial<SyncSettings>) => {
    setState((prev) => ({
      ...prev,
      syncSettings: {
        ...prev.syncSettings,
        ...patch,
      },
    }));
  }, []);

  const replaceFromRemote = useCallback((remoteState: LxgState) => {
    setState({
      ...INITIAL_STATE,
      ...remoteState,
      metrics: {
        ...INITIAL_STATE.metrics,
        ...(remoteState.metrics ?? {}),
      },
      syncSettings: {
        ...INITIAL_STATE.syncSettings,
        ...(remoteState.syncSettings ?? {}),
        lastSyncedAt: new Date().toISOString(),
      },
    });
  }, []);

  const pullRemoteState = useCallback(async (isManual = false) => {
    const { webAppUrl, secretKey } = stateRef.current.syncSettings;
    if (!isSyncConfigured(webAppUrl, secretKey)) {
      if (isManual) setSyncStatus('idle');
      return;
    }

    if (isSyncingRef.current) {
      return;
    }

    if (isManual) {
      setSyncStatus('syncing');
    }

    try {
      const data = await fetchSheetState(webAppUrl, secretKey);
      // Re-check lock after await so an in-flight POST mutation is never clobbered
      if (isSyncingRef.current) {
        return;
      }

      if (data.state) {
        setState((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            ...(data.state?.metrics ?? {}),
          },
          checklist: Array.isArray(data.state?.checklist)
            ? data.state.checklist
            : prev.checklist,
          reels: Array.isArray(data.state?.reels)
            ? data.state.reels
            : prev.reels,
          syncSettings: {
            ...prev.syncSettings,
            lastSyncedAt: new Date().toISOString(),
          },
        }));
      }
      setSyncStatus('success');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  const syncNow = useCallback(async () => {
    await pullRemoteState(true);
  }, [pullRemoteState]);

  useEffect(() => {
    const { webAppUrl, secretKey } = state.syncSettings;
    if (!isSyncConfigured(webAppUrl, secretKey)) {
      setSyncStatus('idle');
      return;
    }

    // Immediate fetch on mount/config change when visible
    if (document.visibilityState === 'visible') {
      void pullRemoteState(false);
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !isSyncingRef.current) {
        void pullRemoteState(false);
      }
    }, 3000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && !isSyncingRef.current) {
        void pullRemoteState(false);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [state.syncSettings.webAppUrl, state.syncSettings.secretKey, pullRemoteState]);

  const value = useMemo<LxgContextValue>(
    () => ({
      state,
      incrementMetric,
      updateMetrics,
      addReel,
      toggleChecklistItem,
      toggleSchoolMode,
      updateSyncSettings,
      replaceFromRemote,
      syncNow,
      syncStatus,
    }),
    [
      state,
      incrementMetric,
      updateMetrics,
      addReel,
      toggleChecklistItem,
      toggleSchoolMode,
      updateSyncSettings,
      replaceFromRemote,
      syncNow,
      syncStatus,
    ]
  );

  return <LxgContext.Provider value={value}>{children}</LxgContext.Provider>;
};

export function useLxg(): LxgContextValue {
  const ctx = useContext(LxgContext);
  if (!ctx) {
    throw new Error('useLxg must be used within an LxgProvider');
  }
  return ctx;
}
