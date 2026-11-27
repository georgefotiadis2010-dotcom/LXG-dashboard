export type MetricKey =
  | 'monthlyListeners'
  | 'allTimeStreams'
  | 'topSingleStreams'
  | 'instagramFollowers'
  | 'topReelViews'
  | 'catalogReleases';

export interface MetricTarget {
  target2027: number;
  labelReadyRadar: number;
}

export interface LxgMetrics {
  monthlyListeners: number;
  spotifyFollowers: number;
  allTimeStreams: number;
  topSingleStreams: number;
  topSingleName: string;
  instagramFollowers: number;
  topReelViews: number;
  topReelName: string;
  catalogReleases: number;
  activeReleaseNames: string[];
  overallPortfolioProgress: number;
}

export type ReleaseStatus = 'UPCOMING' | 'SCHEDULED' | 'TARGET' | 'ACTIVE';

export interface ReleasePipelineItem {
  id: string;
  title: string;
  dateLabel: string;
  status: ReleaseStatus;
  strategy: string;
  targetSummary: string;
  preSaveUrl?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: 'I KNOW' | 'WATCH' | 'UNEARTHED' | 'GROWTH';
  dueDate: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type ReelTrack = 'I KNOW' | 'WATCH' | 'OTHER';

export interface ReelEntry {
  id: string;
  date: string;
  hook: string;
  visualFormat: string;
  track: ReelTrack;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  note?: string;
  flag?: string;
}

export interface SyncSettings {
  webAppUrl: string;
  secretKey: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface LxgState {
  version: number;
  horizonDate: string;
  schoolMode: boolean;
  metrics: LxgMetrics;
  monthlyListenerGoal?: number;
  monthlyListenerGoals?: Record<string, number>;
  pipeline: ReleasePipelineItem[];
  checklist: ChecklistItem[];
  reels: ReelEntry[];
  syncSettings: SyncSettings;
}

export type NewReelInput = Omit<ReelEntry, 'id' | 'engagementRate'> & {
  engagementRate?: number;
};

export type TelemetryPlatform = 'spotify' | 'instagram';

export type TelemetryViewMode = TelemetryPlatform | 'all';

export type TelemetryMonthCode = 'NOV' | 'DEC' | 'JAN' | 'FEB' | 'MAR' | 'APR';

export interface TelemetryMilestone {
  value: number;
  label: string;
}

export interface TelemetrySecondaryStat {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta: string;
  deltaPositive: boolean;
}

export interface TelemetryTopCallout {
  kind: 'track' | 'reel';
  title: string;
  metricLabel: string;
  metricValue: number;
  delta: string;
  meta: string;
  accentTag?: string;
}

export interface TelemetryMonthSnapshot {
  month: TelemetryMonthCode;
  fullLabel: string;
  heroValue: number;
  delta: string;
  deltaPositive: boolean;
  secondaryStats: [
    TelemetrySecondaryStat,
    TelemetrySecondaryStat,
    TelemetrySecondaryStat,
  ];
  sparkline: number[];
  topCallout: TelemetryTopCallout;
}

export interface PlatformThemeTokens {
  primary: string;
  deep: string;
  glowRgba: string;
}

export interface PlatformTelemetryConfig {
  platform: TelemetryPlatform;
  label: string;
  handle: string;
  heroLabel: string;
  theme: PlatformThemeTokens;
  milestones: TelemetryMilestone[];
  timeline: TelemetryMonthSnapshot[];
}

export interface LxgTelemetryConfig {
  artistName: string;
  handle: string;
  months: TelemetryMonthCode[];
  platforms: Record<TelemetryPlatform, PlatformTelemetryConfig>;
}

export interface LxgContextValue {
  state: LxgState;
  incrementMetric: (key: MetricKey, delta: number) => void;
  updateMetrics: (patch: Partial<LxgMetrics>) => void;
  addReel: (reel: NewReelInput) => void;
  toggleChecklistItem: (id: string) => void;
  toggleSchoolMode: () => void;
  updateSyncSettings: (patch: Partial<SyncSettings>) => void;
  replaceFromRemote: (remoteState: LxgState) => void;
  syncNow: () => Promise<void>;
  syncStatus: SyncStatus;
  // Telemetry UI & data API
  telemetry: LxgTelemetryConfig;
  activePlatform: TelemetryViewMode;
  setActivePlatform: (mode: TelemetryViewMode) => void;
  activeMonthIndex: number;
  setActiveMonthIndex: (index: number) => void;
  isSheetOpen: boolean;
  sheetPlatform: TelemetryPlatform;
  focusedStatId: string | null;
  openSheet: (platform?: TelemetryPlatform, statId?: string) => void;
  closeSheet: () => void;
  getPlatformSnapshot: (
    platform: TelemetryPlatform,
    monthIndex?: number
  ) => TelemetryMonthSnapshot;
}
