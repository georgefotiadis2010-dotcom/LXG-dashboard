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
  pipeline: ReleasePipelineItem[];
  checklist: ChecklistItem[];
  reels: ReelEntry[];
  syncSettings: SyncSettings;
}

export type NewReelInput = Omit<ReelEntry, 'id' | 'engagementRate'> & {
  engagementRate?: number;
};

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
}
