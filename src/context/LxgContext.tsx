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
  LxgTelemetryConfig,
  MetricKey,
  MetricTarget,
  NewReelInput,
  ReelEntry,
  SyncSettings,
  SyncStatus,
  TelemetryMonthCode,
  TelemetryMonthSnapshot,
  TelemetryPlatform,
  TelemetryViewMode,
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

export const TELEMETRY_MONTHS: TelemetryMonthCode[] = [
  'NOV',
  'DEC',
  'JAN',
  'FEB',
  'MAR',
  'APR',
];

export const LXG_TELEMETRY_CONFIG: LxgTelemetryConfig = {
  artistName: 'LXG',
  handle: '@officiallxgmusic',
  months: TELEMETRY_MONTHS,
  platforms: {
    spotify: {
      platform: 'spotify',
      label: 'SPOTIFY',
      handle: '@officiallxgmusic',
      heroLabel: 'MONTHLY LISTENERS',
      theme: {
        primary: '#1ED760',
        deep: '#0A2916',
        glowRgba: 'rgba(30, 215, 96, 0.22)',
      },
      milestones: [
        { value: 50, label: '50' },
        { value: 100, label: '100' },
        { value: 200, label: '200' },
        { value: 350, label: '350' },
        { value: 600, label: '600' },
        { value: 1000, label: '1K' },
      ],
      timeline: [
        {
          month: 'NOV',
          fullLabel: 'NOVEMBER 2026',
          isGoalMonth: false,
          heroValue: 40,
          heroGoal: 50,
          delta: '+14.3%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 350, goal: 400, delta: '+12.9%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 32, goal: 40, delta: '+14.3%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 59, goal: 75, delta: '+18.0%', deltaPositive: true },
          ],
          sparkline: [
            26, 27, 27, 28, 29, 29, 30, 31, 31, 32,
            32, 33, 33, 34, 34, 35, 35, 36, 36, 37,
            37, 38, 38, 38, 39, 39, 39, 40, 40, 40,
          ],
          topCallout: {
            kind: 'track',
            title: 'Best Thing (28d)',
            metricLabel: 'STREAMS',
            metricValue: 59,
            delta: '+18.0%',
            meta: '2 RELEASES // Best Thing · On Our Own',
            accentTag: 'TOP TRACK',
          },
        },
        {
          month: 'DEC',
          fullLabel: 'DECEMBER 2026',
          isGoalMonth: true,
          heroValue: 65,
          heroGoal: 65,
          delta: '+62.5%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 520, goal: 520, delta: '+48.6%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 48, goal: 48, delta: '+50.0%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 145, goal: 145, delta: '+145.8%', deltaPositive: true },
          ],
          sparkline: [
            40, 41, 42, 43, 45, 47, 48, 49, 50, 51,
            52, 53, 54, 55, 56, 57, 58, 59, 60, 60,
            61, 62, 62, 63, 63, 64, 64, 65, 65, 65,
          ],
          topCallout: {
            kind: 'track',
            title: 'I KNOW',
            metricLabel: 'STREAMS',
            metricValue: 145,
            delta: '+145.8%',
            meta: 'TARGET // RELEASE WEEK 120+ STREAMS',
            accentTag: 'NEXT DROP',
          },
        },
        {
          month: 'JAN',
          fullLabel: 'JANUARY 2027',
          isGoalMonth: true,
          heroValue: 110,
          heroGoal: 110,
          delta: '+69.2%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 890, goal: 890, delta: '+71.2%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 74, goal: 74, delta: '+54.2%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 260, goal: 260, delta: '+79.3%', deltaPositive: true },
          ],
          sparkline: [
            65, 67, 69, 71, 73, 75, 77, 79, 81, 83,
            85, 87, 88, 90, 92, 94, 95, 97, 98, 100,
            101, 103, 104, 105, 106, 107, 108, 109, 110, 110,
          ],
          topCallout: {
            kind: 'track',
            title: 'WATCH',
            metricLabel: 'STREAMS',
            metricValue: 260,
            delta: '+79.3%',
            meta: 'TARGET // WATERFALL RELEASE MOMENTUM',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'FEB',
          fullLabel: 'FEBRUARY 2027',
          isGoalMonth: true,
          heroValue: 165,
          heroGoal: 165,
          delta: '+50.0%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 1380, goal: 1380, delta: '+55.1%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 108, goal: 108, delta: '+45.9%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 410, goal: 410, delta: '+57.7%', deltaPositive: true },
          ],
          sparkline: [
            110, 112, 114, 116, 118, 120, 122, 124, 126, 128,
            130, 132, 134, 136, 138, 140, 142, 144, 146, 148,
            150, 152, 154, 156, 158, 160, 162, 163, 164, 165,
          ],
          topCallout: {
            kind: 'track',
            title: 'WATCH',
            metricLabel: 'STREAMS',
            metricValue: 410,
            delta: '+57.7%',
            meta: 'TARGET // ALGO RADIO + SAVE CARRYOVER',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'MAR',
          fullLabel: 'MARCH 2027',
          isGoalMonth: true,
          heroValue: 235,
          heroGoal: 235,
          delta: '+42.4%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 1960, goal: 1960, delta: '+42.0%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 152, goal: 152, delta: '+40.7%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 580, goal: 580, delta: '+41.5%', deltaPositive: true },
          ],
          sparkline: [
            165, 168, 170, 173, 176, 179, 181, 184, 187, 190,
            192, 195, 198, 200, 203, 206, 208, 211, 214, 216,
            219, 221, 224, 226, 228, 230, 232, 233, 234, 235,
          ],
          topCallout: {
            kind: 'track',
            title: 'I KNOW',
            metricLabel: 'STREAMS',
            metricValue: 580,
            delta: '+41.5%',
            meta: 'TARGET // UNEARTHED HIGH PORTFOLIO',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'APR',
          fullLabel: 'APRIL 2027',
          isGoalMonth: true,
          heroValue: 320,
          heroGoal: 320,
          delta: '+36.2%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'sp-streams', label: 'STREAMS', value: 2680, goal: 2680, delta: '+36.7%', deltaPositive: true },
            { id: 'sp-followers', label: 'FOLLOWERS', value: 205, goal: 205, delta: '+34.9%', deltaPositive: true },
            { id: 'sp-top-single', label: 'TOP SINGLE', value: 790, goal: 790, delta: '+36.2%', deltaPositive: true },
          ],
          sparkline: [
            235, 238, 241, 244, 247, 250, 253, 256, 259, 262,
            265, 268, 271, 274, 277, 280, 283, 286, 289, 292,
            295, 298, 301, 304, 307, 310, 313, 316, 318, 320,
          ],
          topCallout: {
            kind: 'track',
            title: 'WATCH',
            metricLabel: 'STREAMS',
            metricValue: 790,
            delta: '+36.2%',
            meta: 'TARGET // 3-TRACK PORTFOLIO WINDOW',
            accentTag: 'ROADMAP',
          },
        },
      ],
    },
    instagram: {
      platform: 'instagram',
      label: 'INSTAGRAM',
      handle: '@officiallxgmusic',
      heroLabel: 'FOLLOWERS',
      theme: {
        primary: '#FF2E63',
        deep: '#2E0914',
        glowRgba: 'rgba(255, 46, 99, 0.22)',
      },
      milestones: [
        { value: 500, label: '500' },
        { value: 1000, label: '1K' },
        { value: 2500, label: '2.5K' },
        { value: 5000, label: '5K' },
        { value: 10000, label: '10K' },
        { value: 25000, label: '25K' },
      ],
      timeline: [
        {
          month: 'NOV',
          fullLabel: 'NOVEMBER 2026',
          isGoalMonth: false,
          heroValue: 123,
          heroGoal: 150,
          delta: '+18.3%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 6894, goal: 8000, delta: '+24.1%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 7.8, goal: 8.0, suffix: '%', decimals: 1, delta: '+1.2%', deltaPositive: true },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 1212, goal: 1500, delta: '+41.0%', deltaPositive: true },
          ],
          sparkline: [
            88, 90, 91, 92, 94, 95, 97, 98, 99, 101,
            102, 104, 105, 106, 108, 109, 110, 111, 113, 114,
            115, 116, 117, 118, 119, 120, 121, 122, 122, 123,
          ],
          topCallout: {
            kind: 'reel',
            title: 'studio lately..',
            metricLabel: 'VIEWS',
            metricValue: 1212,
            delta: '+41.0%',
            meta: 'WATCH // PERSON THEN DAW // 7.8% ER',
            accentTag: '#1 REACH DRIVER',
          },
        },
        {
          month: 'DEC',
          fullLabel: 'DECEMBER 2026',
          isGoalMonth: true,
          heroValue: 220,
          heroGoal: 220,
          delta: '+78.9%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 10400, goal: 10400, delta: '+50.9%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 8.1, goal: 8.1, suffix: '%', decimals: 1, delta: '+0.3%', deltaPositive: true },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 2100, goal: 2100, delta: '+73.3%', deltaPositive: true },
          ],
          sparkline: [
            123, 126, 129, 133, 136, 140, 144, 148, 151, 155,
            158, 162, 166, 169, 173, 176, 180, 183, 187, 190,
            193, 197, 200, 203, 206, 209, 212, 215, 218, 220,
          ],
          topCallout: {
            kind: 'reel',
            title: 'I KNOW drop reel',
            metricLabel: 'VIEWS',
            metricValue: 2100,
            delta: '+73.3%',
            meta: 'TARGET // EVENING WINDOW DROP REEL',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'JAN',
          fullLabel: 'JANUARY 2027',
          isGoalMonth: true,
          heroValue: 380,
          heroGoal: 380,
          delta: '+72.7%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 16800, goal: 16800, delta: '+61.5%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 8.4, goal: 8.4, suffix: '%', decimals: 1, delta: '+0.3%', deltaPositive: true },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 3400, goal: 3400, delta: '+61.9%', deltaPositive: true },
          ],
          sparkline: [
            220, 225, 230, 236, 241, 247, 253, 259, 264, 270,
            276, 282, 288, 294, 300, 306, 312, 318, 324, 329,
            335, 341, 346, 352, 357, 362, 367, 372, 376, 380,
          ],
          topCallout: {
            kind: 'reel',
            title: 'WATCH waterfall teaser',
            metricLabel: 'VIEWS',
            metricValue: 3400,
            delta: '+61.9%',
            meta: 'TARGET // JAN 2027 WATERFALL CAMPAIGN',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'FEB',
          fullLabel: 'FEBRUARY 2027',
          isGoalMonth: true,
          heroValue: 560,
          heroGoal: 560,
          delta: '+47.4%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 23500, goal: 23500, delta: '+39.9%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 8.2, goal: 8.2, suffix: '%', decimals: 1, delta: '-0.2%', deltaPositive: false },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 4600, goal: 4600, delta: '+35.3%', deltaPositive: true },
          ],
          sparkline: [
            380, 386, 392, 398, 405, 411, 418, 424, 431, 437,
            444, 450, 457, 463, 470, 476, 483, 489, 496, 502,
            508, 514, 520, 526, 532, 538, 544, 550, 555, 560,
          ],
          topCallout: {
            kind: 'reel',
            title: 'bedroom DAW breakdown',
            metricLabel: 'VIEWS',
            metricValue: 4600,
            delta: '+35.3%',
            meta: 'TARGET // 500+ FOLLOWERS MILESTONE',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'MAR',
          fullLabel: 'MARCH 2027',
          isGoalMonth: true,
          heroValue: 790,
          heroGoal: 790,
          delta: '+41.1%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 31200, goal: 31200, delta: '+32.8%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 8.7, goal: 8.7, suffix: '%', decimals: 1, delta: '+0.5%', deltaPositive: true },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 6200, goal: 6200, delta: '+34.8%', deltaPositive: true },
          ],
          sparkline: [
            560, 568, 576, 584, 592, 600, 608, 616, 624, 632,
            640, 648, 656, 664, 672, 680, 688, 696, 704, 712,
            720, 728, 736, 744, 752, 760, 768, 776, 783, 790,
          ],
          topCallout: {
            kind: 'reel',
            title: 'Unearthed High live cut',
            metricLabel: 'VIEWS',
            metricValue: 6200,
            delta: '+34.8%',
            meta: 'TARGET // UNEARTHED PORTFOLIO PUSH',
            accentTag: 'ROADMAP',
          },
        },
        {
          month: 'APR',
          fullLabel: 'APRIL 2027',
          isGoalMonth: true,
          heroValue: 1050,
          heroGoal: 1050,
          delta: '+32.9%',
          deltaPositive: true,
          secondaryStats: [
            { id: 'ig-views', label: 'REEL VIEWS', value: 40500, goal: 40500, delta: '+29.8%', deltaPositive: true },
            { id: 'ig-engagement', label: 'ENGAGEMENT', value: 9.0, goal: 9.0, suffix: '%', decimals: 1, delta: '+0.3%', deltaPositive: true },
            { id: 'ig-top-reel', label: 'TOP REEL', value: 8100, goal: 8100, delta: '+30.6%', deltaPositive: true },
          ],
          sparkline: [
            790, 799, 808, 817, 826, 835, 844, 853, 862, 871,
            880, 889, 898, 907, 916, 925, 934, 943, 952, 961,
            970, 979, 988, 997, 1006, 1015, 1024, 1033, 1042, 1050,
          ],
          topCallout: {
            kind: 'reel',
            title: '1K followers studio session',
            metricLabel: 'VIEWS',
            metricValue: 8100,
            delta: '+30.6%',
            meta: 'TARGET // 1K FOLLOWERS MILESTONE',
            accentTag: 'ROADMAP',
          },
        },
      ],
    },
  },
};

export function getTelemetrySnapshot(
  platform: TelemetryPlatform,
  monthIndex: number = 0
): TelemetryMonthSnapshot {
  const timeline = LXG_TELEMETRY_CONFIG.platforms[platform].timeline;
  const clampedIndex = Math.max(0, Math.min(timeline.length - 1, Math.round(monthIndex)));
  return timeline[clampedIndex];
}

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
    webAppUrl: 'https://script.google.com/macros/s/AKfycbx0uzL9crbVIhD6W4Cy-8uAK9iYKrRob7KFsWeJ-8Tsc7JmvsNm8MwrUW9FYMUhnXw/exec',
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
        webAppUrl:
          INITIAL_STATE.syncSettings.webAppUrl ||
          (parsed.syncSettings?.webAppUrl ?? INITIAL_STATE.syncSettings.webAppUrl),
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
  const [activePlatform, setActivePlatformState] = useState<TelemetryViewMode>('spotify');
  const [activeMonthIndex, setActiveMonthIndexState] = useState<number>(0);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetPlatform, setSheetPlatform] = useState<TelemetryPlatform>('spotify');
  const [focusedStatId, setFocusedStatId] = useState<string | null>(null);
  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const telemetry = useMemo<LxgTelemetryConfig>(() => {
    const metrics = state.metrics ?? INITIAL_STATE.metrics;
    const reels = Array.isArray(state.reels) ? state.reels : [];
    const monthlyListeners = Number(metrics.monthlyListeners ?? 40) || 0;
    const allTimeStreams = Number(metrics.allTimeStreams ?? 350) || 0;
    const spotifyFollowers = Number(metrics.spotifyFollowers ?? 32) || 0;
    const topSingleStreams = Number(metrics.topSingleStreams ?? 59) || 0;
    const topSingleName = metrics.topSingleName || 'Best Thing (28d)';
    const catalogReleases = Number(metrics.catalogReleases ?? 2) || 0;
    const activeReleaseNames = Array.isArray(metrics.activeReleaseNames)
      ? metrics.activeReleaseNames
      : ['Best Thing', 'On Our Own'];

    const instagramFollowers = Number(metrics.instagramFollowers ?? 123) || 0;
    const topReelViews = Number(metrics.topReelViews ?? 1212) || 0;
    const topReelName = metrics.topReelName || 'studio lately..';

    const totalReelViews = reels.reduce((sum, r) => sum + (Number(r?.views) || 0), 0);
    const topReel =
      reels.find((r) => r?.hook === topReelName) ??
      reels.reduce<ReelEntry | undefined>(
        (best, r) => (!best || (Number(r?.views) || 0) > (Number(best?.views) || 0) ? r : best),
        undefined
      );
    const topReelEr = Number(topReel?.engagementRate ?? 7.8) || 7.8;
    const topReelTrack = topReel?.track ?? 'LXG';
    const topReelFormat = (topReel?.visualFormat ?? 'REEL').toUpperCase();
    const topReelMeta = topReel
      ? `${topReelTrack} // ${topReelFormat} // ${topReelEr.toFixed(1)}% ER`
      : `WATCH // PERSON THEN DAW // ${topReelEr.toFixed(1)}% ER`;

    const baseSpotify = LXG_TELEMETRY_CONFIG.platforms.spotify;
    const baseInstagram = LXG_TELEMETRY_CONFIG.platforms.instagram;

    const liveSpotifyNov: TelemetryMonthSnapshot = {
      ...baseSpotify.timeline[0],
      heroValue: monthlyListeners,
      secondaryStats: [
        {
          ...baseSpotify.timeline[0].secondaryStats[0],
          value: allTimeStreams,
        },
        {
          ...baseSpotify.timeline[0].secondaryStats[1],
          value: spotifyFollowers,
        },
        {
          ...baseSpotify.timeline[0].secondaryStats[2],
          value: topSingleStreams,
        },
      ],
      sparkline: [
        ...baseSpotify.timeline[0].sparkline.slice(0, 29),
        monthlyListeners,
      ],
      topCallout: {
        ...baseSpotify.timeline[0].topCallout,
        title: topSingleName,
        metricValue: topSingleStreams,
        meta: `${catalogReleases} RELEASES // ${activeReleaseNames.join(' · ')}`,
      },
    };

    const liveInstagramNov: TelemetryMonthSnapshot = {
      ...baseInstagram.timeline[0],
      heroValue: instagramFollowers,
      secondaryStats: [
        {
          ...baseInstagram.timeline[0].secondaryStats[0],
          value: totalReelViews,
        },
        {
          ...baseInstagram.timeline[0].secondaryStats[1],
          value: topReelEr,
        },
        {
          ...baseInstagram.timeline[0].secondaryStats[2],
          value: topReelViews,
        },
      ],
      sparkline: [
        ...baseInstagram.timeline[0].sparkline.slice(0, 29),
        instagramFollowers,
      ],
      topCallout: {
        ...baseInstagram.timeline[0].topCallout,
        title: topReelName,
        metricValue: topReelViews,
        meta: topReelMeta,
        accentTag: topReel?.note ? '#1 REACH DRIVER' : baseInstagram.timeline[0].topCallout.accentTag,
      },
    };

    return {
      ...LXG_TELEMETRY_CONFIG,
      platforms: {
        spotify: {
          ...baseSpotify,
          timeline: [liveSpotifyNov, ...baseSpotify.timeline.slice(1)],
        },
        instagram: {
          ...baseInstagram,
          timeline: [liveInstagramNov, ...baseInstagram.timeline.slice(1)],
        },
      },
    };
  }, [state]);

  const setActivePlatform = useCallback((mode: TelemetryViewMode) => {
    setActivePlatformState(mode);
    if (mode !== 'all') {
      setSheetPlatform(mode);
    }
  }, []);

  const setActiveMonthIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(TELEMETRY_MONTHS.length - 1, Math.round(index)));
    setActiveMonthIndexState(clamped);
  }, []);

  const openSheet = useCallback(
    (platform?: TelemetryPlatform, statId?: string) => {
      const targetPlatform: TelemetryPlatform =
        platform ?? (activePlatform === 'all' ? 'spotify' : activePlatform);
      setSheetPlatform(targetPlatform);
      setFocusedStatId(statId ?? null);
      setIsSheetOpen(true);
    },
    [activePlatform]
  );

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const getPlatformSnapshot = useCallback(
    (platform: TelemetryPlatform, monthIndex: number = activeMonthIndex) => {
      const timeline = telemetry.platforms[platform].timeline;
      const clampedIndex = Math.max(0, Math.min(timeline.length - 1, Math.round(monthIndex)));
      return timeline[clampedIndex];
    },
    [telemetry, activeMonthIndex]
  );

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
        console.log('[LXG Sync] monthlyListenerGoal:', data.state.monthlyListenerGoal, 'monthlyListenerGoals:', data.state.monthlyListenerGoals);
        setState((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            ...(data.state?.metrics ?? {}),
          },
          monthlyListenerGoal:
            typeof data.state?.monthlyListenerGoal === 'number'
              ? data.state.monthlyListenerGoal
              : prev.monthlyListenerGoal,
          monthlyListenerGoals:
            data.state?.monthlyListenerGoals &&
            typeof data.state.monthlyListenerGoals === 'object'
              ? data.state.monthlyListenerGoals
              : prev.monthlyListenerGoals,
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
      telemetry,
      activePlatform,
      setActivePlatform,
      activeMonthIndex,
      setActiveMonthIndex,
      isSheetOpen,
      sheetPlatform,
      focusedStatId,
      openSheet,
      closeSheet,
      getPlatformSnapshot,
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
      telemetry,
      activePlatform,
      setActivePlatform,
      activeMonthIndex,
      setActiveMonthIndex,
      isSheetOpen,
      sheetPlatform,
      focusedStatId,
      openSheet,
      closeSheet,
      getPlatformSnapshot,
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

export function useTelemetry() {
  const {
    telemetry,
    activePlatform,
    setActivePlatform,
    activeMonthIndex,
    setActiveMonthIndex,
    isSheetOpen,
    sheetPlatform,
    focusedStatId,
    openSheet,
    closeSheet,
    getPlatformSnapshot,
  } = useLxg();

  return {
    telemetry,
    activePlatform,
    setActivePlatform,
    activeMonthIndex,
    setActiveMonthIndex,
    activeMonth: telemetry.months[activeMonthIndex],
    isSheetOpen,
    sheetPlatform,
    focusedStatId,
    openSheet,
    closeSheet,
    getPlatformSnapshot,
    spotifySnapshot: getPlatformSnapshot('spotify', activeMonthIndex),
    instagramSnapshot: getPlatformSnapshot('instagram', activeMonthIndex),
    sheetSnapshot: getPlatformSnapshot(sheetPlatform, activeMonthIndex),
  };
}
