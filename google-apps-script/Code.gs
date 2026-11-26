/**
 * LXG Command — Google Apps Script Backend
 * Tailored to: "LXG Music - Growth & Goal Tracker"
 *
 * Tabs read/written:
 *   - Goals & Baseline Dashboard
 *   - Content Performance
 *   - Weekly Log
 *   - App_Checklist (auto-created with default items if missing)
 */

const SHEET_NAMES = {
  GOALS: 'Goals & Baseline Dashboard',
  CONTENT: 'Content Performance',
  WEEKLY: 'Weekly Log',
  CHECKLIST: 'App_Checklist',
};

const DEFAULT_CHECKLIST = [
  ['iknow-presave', 'Verify LANDR pre-save link (release.landr.com/991061532664) in IG bio', false, 'I KNOW'],
  ['iknow-canvas', 'Upload Spotify Canvas & Pitching notes before Nov 27', false, 'I KNOW'],
  ['iknow-release-day', 'Post Release Day Reel + Story sequence on Nov 27', false, 'I KNOW'],
  ['iknow-radar-window', 'Monitor Release Radar & 7d stream/listener targets (120 streams / 50 listeners) through Dec 4', false, 'I KNOW'],
  ['watch-master', 'Finalize WATCH master & artwork for January 2027 waterfall release', false, 'WATCH'],
  ['unearthed-portfolio', 'Select & submit 3-track portfolio for triple j Unearthed High (Mar–May 2027)', false, 'Unearthed High'],
];

/**
 * Handles GET requests from LXG Command (polling & focus refresh).
 */
function doGet(e) {
  try {
    const key = e && e.parameter ? e.parameter.key : '';
    if (!isValidKey_(key)) {
      return jsonResponse_({ ok: false, error: 'Unauthorized: invalid or missing sync key' });
    }

    const state = readFullState_();
    return jsonResponse_({ ok: true, state: state });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

/**
 * Handles POST requests from LXG Command (optimistic mutations).
 * Expects Content-Type: text/plain;charset=utf-8 with JSON body:
 *   { key: string, action: 'UPDATE_METRICS' | 'ADD_REEL' | 'TOGGLE_CHECKLIST', payload: object }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Missing request body' });
    }

    const body = JSON.parse(e.postData.contents);
    if (!isValidKey_(body.key)) {
      return jsonResponse_({ ok: false, error: 'Unauthorized: invalid or missing sync key' });
    }

    const action = body.action;
    const payload = body.payload || {};

    if (action === 'UPDATE_METRICS') {
      updateMetrics_(payload);
    } else if (action === 'ADD_REEL') {
      addReel_(payload);
    } else if (action === 'TOGGLE_CHECKLIST') {
      toggleChecklist_(payload);
    } else {
      return jsonResponse_({ ok: false, error: 'Unknown action: ' + action });
    }

    const state = readFullState_();
    return jsonResponse_({ ok: true, state: state });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

// ---------------------------------------------------------------------------
// Auth & Response Helpers
// ---------------------------------------------------------------------------

function isValidKey_(providedKey) {
  const expected = PropertiesService.getScriptProperties().getProperty('SYNC_KEY');
  if (!expected) return false;
  return String(providedKey || '') === String(expected);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// State Readers
// ---------------------------------------------------------------------------

function readFullState_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    metrics: readMetrics_(ss),
    monthlyListenerGoal: readMonthlyListenerGoal_(ss),
    monthlyListenerGoals: readMonthlyListenerGoals_(ss),
    reels: readReels_(ss),
    weeklyLog: readWeeklyLog_(ss),
    checklist: readChecklist_(ss),
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Reads this month's Target Monthly Listeners from the "Monthly Goals" sheet.
 * Layout: Months in Column B (e.g. "Nov 2026"), Target Monthly in Column C.
 */
function readMonthlyListenerGoal_(ss) {
  const sheet =
    ss.getSheets().find((s) => s.getName().trim().toLowerCase().indexOf('monthly goals') !== -1) ||
    null;
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const now = new Date();
  const tz = ss.getSpreadsheetTimeZone();
  const shortMonthYear = Utilities.formatDate(now, tz, 'MMM yyyy').toLowerCase(); // e.g. "nov 2026"
  const fullMonthYear = Utilities.formatDate(now, tz, 'MMMM yyyy').toLowerCase(); // e.g. "november 2026"
  const ym = Utilities.formatDate(now, tz, 'yyyy-MM'); // e.g. "2026-11"

  // Find "Target Monthly" column from header row (usually Col C / index 2)
  let targetCol = 2;
  for (let r = 0; r < Math.min(10, data.length); r++) {
    const idx = data[r].findIndex(
      (h) => String(h || '').trim().toLowerCase().indexOf('target monthly') !== -1
    );
    if (idx !== -1) {
      targetCol = idx;
      break;
    }
  }

  for (let r = 0; r < data.length; r++) {
    const rawMonth = data[r][1] || data[r][0];
    if (!rawMonth) continue;

    let monthStr = '';
    if (rawMonth instanceof Date) {
      monthStr = Utilities.formatDate(rawMonth, tz, 'MMM yyyy').toLowerCase();
    } else {
      monthStr = String(rawMonth).trim().toLowerCase();
    }

    if (
      monthStr === shortMonthYear ||
      monthStr === fullMonthYear ||
      monthStr === ym ||
      monthStr.indexOf(shortMonthYear) !== -1
    ) {
      const val = Number(data[r][targetCol]);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

/**
 * Reads all monthly Target Monthly Listeners from the "Monthly Goals" sheet
 * as a map keyed by "yyyy-MM" (e.g. { "2026-11": 500, "2026-12": 1000 }).
 */
function readMonthlyListenerGoals_(ss) {
  const sheet =
    ss.getSheets().find((s) => s.getName().trim().toLowerCase().indexOf('monthly goals') !== -1) ||
    null;
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};

  const tz = ss.getSpreadsheetTimeZone();
  let targetCol = 2;
  for (let r = 0; r < Math.min(10, data.length); r++) {
    const idx = data[r].findIndex(
      (h) => String(h || '').trim().toLowerCase().indexOf('target monthly') !== -1
    );
    if (idx !== -1) {
      targetCol = idx;
      break;
    }
  }

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const goals = {};
  for (let r = 0; r < data.length; r++) {
    const rawMonth = data[r][1] || data[r][0];
    if (!rawMonth) continue;

    const val = Number(data[r][targetCol]);
    if (isNaN(val) || val <= 0) continue;

    let ymKey = '';
    let shortKey = '';
    if (rawMonth instanceof Date) {
      ymKey = Utilities.formatDate(rawMonth, tz, 'yyyy-MM');
      shortKey = Utilities.formatDate(rawMonth, tz, 'MMM').toLowerCase();
    } else {
      const str = String(rawMonth).trim().toLowerCase();
      const ymMatch = str.match(/^(\d{4})-(\d{1,2})/);
      if (ymMatch) {
        ymKey = ymMatch[1] + '-' + ('0' + ymMatch[2]).slice(-2);
      } else {
        const mIdx = monthNames.findIndex((m) => str.indexOf(m) !== -1);
        if (mIdx !== -1) {
          shortKey = monthNames[mIdx];
          const yMatch = str.match(/(\d{4})/);
          if (yMatch) {
            ymKey = yMatch[1] + '-' + ('0' + (mIdx + 1)).slice(-2);
          }
        }
      }
    }

    if (ymKey) {
      goals[ymKey] = val;
    }
    if (shortKey && !goals[shortKey]) {
      goals[shortKey] = val;
    }
  }
  return goals;
}

/**
 * Reads core metrics from "Goals & Baseline Dashboard".
 * Matches metric labels in column A/B and reads current values from column C (or B).
 */
function readMetrics_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.GOALS);
  const defaults = {
    monthlyListeners: 40,
    allTimeStreams: 350,
    topSingleStreams: 59,
    igFollowers: 123,
    topReelViews: 1212,
    catalogReleases: 2,
  };

  if (!sheet) return defaults;

  const data = sheet.getDataRange().getValues();
  const findValue = function (patterns, fallback) {
    for (let r = 0; r < data.length; r++) {
      const label = String(data[r][0] || data[r][1] || '').toLowerCase();
      for (let p = 0; p < patterns.length; p++) {
        if (label.indexOf(patterns[p]) !== -1) {
          const val = Number(data[r][2] !== '' && data[r][2] !== undefined ? data[r][2] : data[r][1]);
          if (!isNaN(val)) return val;
        }
      }
    }
    return fallback;
  };

  return {
    monthlyListeners: findValue(['monthly spotify listeners', 'monthly listeners'], defaults.monthlyListeners),
    allTimeStreams: findValue(['all-time catalog streams', 'all-time streams'], defaults.allTimeStreams),
    topSingleStreams: findValue(['top single streams', 'best thing'], defaults.topSingleStreams),
    igFollowers: findValue(['instagram followers', 'ig followers'], defaults.igFollowers),
    topReelViews: findValue(['top single reel views', 'top reel views'], defaults.topReelViews),
    catalogReleases: findValue(['catalog releases', 'active releases'], defaults.catalogReleases),
  };
}

/**
 * Reads all Reel rows from "Content Performance" using dynamic header detection.
 */
function readReels_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTENT);
  if (!sheet) return [];

  const headerInfo = findContentHeaderRow_(sheet);
  const headerRowNum = headerInfo.rowNum;
  const headersLower = headerInfo.headers.map(function (h) { return h.toLowerCase(); });
  const findColIdx = function (names, fallbackIdx) {
    for (let c = 0; c < headersLower.length; c++) {
      const h = headersLower[c];
      if (!h) continue;
      for (let n = 0; n < names.length; n++) {
        if (h === names[n] || h.indexOf(names[n]) !== -1) return c;
      }
    }
    return fallbackIdx;
  };

  const idxDate = findColIdx(['date / post', 'date'], 0);
  const idxHook = findColIdx(['hook (text on screen)', 'hook', 'caption/hook preview', 'caption'], 1);
  const idxFormat = findColIdx(['format', 'content / visual description'], 2);
  const idxSong = findColIdx(['song promoted', 'song'], 3);
  const idxViews = findColIdx(['views/reach', 'views'], 4);
  const idxLikes = findColIdx(['likes'], 5);
  const idxComments = findColIdx(['comments'], 6);
  const idxShares = findColIdx(['shares'], 7);
  const idxSaves = findColIdx(['saves / reposts', 'saves', 'saved'], 8);
  const idxEr = findColIdx(['engagement rate %', 'engagement rate', 'er'], 9);
  const idxNotes = findColIdx(['campaign & audio focus', 'notes'], 10);

  const data = sheet.getDataRange().getValues();
  if (data.length <= headerRowNum) return [];

  const reels = [];
  for (let r = headerRowNum; r < data.length; r++) {
    const row = data[r];
    const dateVal = row[idxDate];
    const hook = String(row[idxHook] || '').trim();
    const dateLabel = String(dateVal || '').trim().toLowerCase();
    const hookLower = hook.toLowerCase();
    if (
      !hook ||
      dateLabel.indexOf('total') === 0 || dateLabel.indexOf('average') === 0 ||
      hookLower.indexOf('total') === 0 || hookLower.indexOf('average') === 0
    ) {
      continue;
    }

    const views = Number(row[idxViews]) || 0;
    const likes = Number(row[idxLikes]) || 0;
    const comments = Number(row[idxComments]) || 0;
    const shares = Number(row[idxShares]) || 0;
    const saves = Number(row[idxSaves]) || 0;
    const erRaw = row[idxEr];
    let er;
    if (erRaw !== '' && erRaw !== undefined) {
      if (typeof erRaw === 'number') {
        er = erRaw <= 1 ? Number((erRaw * 100).toFixed(1)) : Number(erRaw.toFixed(1));
      } else {
        er = Number(String(erRaw).replace('%', ''));
      }
    } else {
      er = views > 0 ? Number((((likes + comments + shares + saves) / views) * 100).toFixed(1)) : 0;
    }

    reels.push({
      id: 'reel-' + r,
      date: dateVal instanceof Date ? Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(dateVal || ''),
      hook: hook,
      format: String(row[idxFormat] || ''),
      song: String(row[idxSong] || ''),
      views: views,
      likes: likes,
      comments: comments,
      shares: shares,
      saves: saves,
      engagementRate: er,
      notes: String(row[idxNotes] || ''),
    });
  }

  return reels;
}

/**
 * Reads current week stats from "Weekly Log".
 */
function readWeeklyLog_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.WEEKLY);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const headers = data[0].map(function (h) { return String(h || '').trim(); });
  for (let r = data.length - 1; r >= 1; r--) {
    if (data[r].some(function (cell) { return cell !== '' && cell !== null; })) {
      const entry = {};
      for (let c = 0; c < headers.length; c++) {
        if (headers[c]) entry[headers[c]] = data[r][c];
      }
      return entry;
    }
  }
  return null;
}

/**
 * Reads checklist items from "App_Checklist", auto-creating the tab with
 * default launch items if it does not exist yet.
 */
function readChecklist_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.CHECKLIST);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.CHECKLIST);
    sheet.appendRow(['id', 'label', 'completed', 'category']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    DEFAULT_CHECKLIST.forEach(function (row) {
      sheet.appendRow(row);
    });
  }

  const data = sheet.getDataRange().getValues();
  const items = [];
  for (let r = 1; r < data.length; r++) {
    const id = String(data[r][0] || '').trim();
    const label = String(data[r][1] || '').trim();
    if (!id || !label) continue;
    items.push({
      id: id,
      label: label,
      completed: Boolean(data[r][2]),
      category: String(data[r][3] || ''),
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// State Writers (doPost actions)
// ---------------------------------------------------------------------------

/**
 * Writes updated metrics into their exact rows in "Goals & Baseline Dashboard".
 */
function updateMetrics_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.GOALS);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAMES.GOALS);

  const data = sheet.getDataRange().getValues();
  const fieldMap = [
    { key: 'monthlyListeners', patterns: ['monthly spotify listeners', 'monthly listeners'] },
    { key: 'allTimeStreams', patterns: ['all-time catalog streams', 'all-time streams'] },
    { key: 'topSingleStreams', patterns: ['top single streams', 'best thing'] },
    { key: 'igFollowers', patterns: ['instagram followers', 'ig followers'] },
    { key: 'topReelViews', patterns: ['top single reel views', 'top reel views'] },
    { key: 'catalogReleases', patterns: ['catalog releases', 'active releases'] },
  ];

  fieldMap.forEach(function (field) {
    if (payload[field.key] === undefined || payload[field.key] === null) return;
    const newVal = Number(payload[field.key]);
    if (isNaN(newVal)) return;

    for (let r = 0; r < data.length; r++) {
      const label = String(data[r][0] || data[r][1] || '').toLowerCase();
      const matched = field.patterns.some(function (p) { return label.indexOf(p) !== -1; });
      if (matched) {
        sheet.getRange(r + 1, 3).setValue(newVal);
        break;
      }
    }
  });
}

/**
 * Appends a new formatted Reel row to "Content Performance" and recalculates totals.
 */
function addReel_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTENT);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAMES.CONTENT);

  const views = Number(payload.views) || 0;
  const likes = Number(payload.likes) || 0;
  const comments = Number(payload.comments) || 0;
  const shares = Number(payload.shares) || 0;
  const saves = Number(payload.saves) || 0;
  const er = views > 0
    ? Number((((likes + comments + shares + saves) / views) * 100).toFixed(1))
    : 0;

  const dateStr = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  sheet.appendRow([
    dateStr,
    String(payload.hook || ''),
    String(payload.format || ''),
    String(payload.song || ''),
    views,
    likes,
    comments,
    shares,
    saves,
    er + '%',
    String(payload.notes || ''),
  ]);

  // Recalculate totals if a Total row exists
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    const label = String(data[r][1] || data[r][0] || '').trim().toLowerCase();
    if (label === 'total') {
      const lastDataRow = r; // 1-indexed row above Total
      if (lastDataRow >= 2) {
        sheet.getRange(r + 1, 5).setFormula('=SUM(E2:E' + lastDataRow + ')');
        sheet.getRange(r + 1, 6).setFormula('=SUM(F2:F' + lastDataRow + ')');
        sheet.getRange(r + 1, 7).setFormula('=SUM(G2:G' + lastDataRow + ')');
        sheet.getRange(r + 1, 8).setFormula('=SUM(H2:H' + lastDataRow + ')');
        sheet.getRange(r + 1, 9).setFormula('=SUM(I2:I' + lastDataRow + ')');
      }
      break;
    }
  }
}

/**
 * Updates the boolean completion status in "App_Checklist".
 */
function toggleChecklist_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CHECKLIST);
  if (!sheet) {
    readChecklist_(ss); // auto-create if missing
  }

  const targetSheet = ss.getSheetByName(SHEET_NAMES.CHECKLIST);
  const data = targetSheet.getDataRange().getValues();
  const targetId = String(payload.id || '').trim();

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0] || '').trim() === targetId) {
      const nextVal = payload.completed !== undefined ? Boolean(payload.completed) : !Boolean(data[r][2]);
      targetSheet.getRange(r + 1, 3).setValue(nextVal);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Sheets Menu & Automated Instagram Graph API Sync
// ---------------------------------------------------------------------------

const IG_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0/';

/**
 * Adds a custom menu to the Google Sheet for manual and scheduled Instagram syncs.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('LXG Command')
    .addItem('Sync Instagram Stats', 'syncInstagramStats')
    .addSeparator()
    .addItem('Enable Auto-Sync (Every 30m)', 'setupAutoSyncEvery30Minutes')
    .addItem('Disable Auto-Sync', 'removeAutoSync')
    .addToUi();
}

/**
 * Installs a time-driven trigger to run syncInstagramStats every 30 minutes.
 * Clears any existing syncInstagramStats triggers first to avoid duplicates.
 */
function setupAutoSyncEvery30Minutes() {
  removeAutoSync_(true);

  ScriptApp.newTrigger('syncInstagramStats')
    .timeBased()
    .everyMinutes(30)
    .create();

  Logger.log('Enabled automatic Instagram sync every 30 minutes.');
  try {
    SpreadsheetApp.getUi().alert('Auto-sync enabled! Instagram stats will now update every 30 minutes.');
  } catch (e) {
    // Ignore when executed outside the Sheet UI context
  }
}

/**
 * Removes all scheduled triggers for syncInstagramStats.
 */
function removeAutoSync() {
  const removed = removeAutoSync_(false);
  Logger.log('Disabled automatic Instagram sync (removed ' + removed + ' trigger(s)).');
  try {
    SpreadsheetApp.getUi().alert('Auto-sync disabled (' + removed + ' trigger(s) removed).');
  } catch (e) {
    // Ignore when executed outside the Sheet UI context
  }
}

/**
 * Deletes existing triggers targeting syncInstagramStats.
 */
function removeAutoSync_(silent) {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncInstagramStats') {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });
  if (!silent) {
    Logger.log('Removed ' + removed + ' existing syncInstagramStats trigger(s).');
  }
  return removed;
}

/**
 * Fetches live Instagram account & recent media metrics via Meta Graph API v21.0
 * and updates "Goals & Baseline Dashboard" and "Content Performance".
 */
function syncInstagramStats() {
  const props = PropertiesService.getScriptProperties();
  const igUserId = String(props.getProperty('IG_USER_ID') || '').trim();
  const accessToken = String(props.getProperty('IG_ACCESS_TOKEN') || '').trim();

  if (!igUserId) {
    throw new Error('Missing required Script Property: IG_USER_ID. Add it in Project Settings -> Script Properties.');
  }
  if (!accessToken) {
    throw new Error('Missing required Script Property: IG_ACCESS_TOKEN. Add it in Project Settings -> Script Properties.');
  }

  Logger.log('Starting Instagram Graph API sync for IG_USER_ID=' + igUserId);

  // 1. Account Profile & Totals
  const profileUrl = IG_GRAPH_BASE_URL + encodeURIComponent(igUserId)
    + '?fields=username,followers_count,follows_count,media_count'
    + '&access_token=' + encodeURIComponent(accessToken);
  const profile = fetchMetaGraphJson_(profileUrl, 'account profile');
  Logger.log('Fetched profile for @' + (profile.username || 'unknown')
    + ' (followers=' + (profile.followers_count || 0)
    + ', media_count=' + (profile.media_count || 0) + ')');

  // 2. Account-Level Insights (28-day / Daily total_value)
  const insightsUrl = IG_GRAPH_BASE_URL + encodeURIComponent(igUserId)
    + '/insights?metric=reach,profile_views,accounts_engaged,total_interactions'
    + '&period=day&metric_type=total_value'
    + '&access_token=' + encodeURIComponent(accessToken);
  const accountInsightsRaw = fetchMetaGraphJson_(insightsUrl, 'account insights');
  const accountInsights = parseInsightsMap_(accountInsightsRaw.data);
  Logger.log('Fetched account insights: reach=' + (accountInsights.reach || 0)
    + ', profile_views=' + (accountInsights.profile_views || 0)
    + ', accounts_engaged=' + (accountInsights.accounts_engaged || 0)
    + ', total_interactions=' + (accountInsights.total_interactions || 0));

  // 3. Recent Media & Reel Performance (Last 25 posts)
  const mediaUrl = IG_GRAPH_BASE_URL + encodeURIComponent(igUserId)
    + '/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count'
    + '&limit=25&access_token=' + encodeURIComponent(accessToken);
  const mediaRes = fetchMetaGraphJson_(mediaUrl, 'recent media');
  const mediaItems = Array.isArray(mediaRes.data) ? mediaRes.data : [];
  Logger.log('Fetched ' + mediaItems.length + ' recent media items.');

  // 4. Per-Post Insights
  const enrichedPosts = mediaItems.map(function (item) {
    const postInsights = fetchMediaInsightsGracefully_(item, accessToken);
    return {
      id: String(item.id || ''),
      caption: item.caption || '',
      mediaType: String(item.media_type || ''),
      mediaProductType: String(item.media_product_type || ''),
      timestamp: item.timestamp || '',
      permalink: String(item.permalink || ''),
      likeCount: Number(item.like_count) || 0,
      commentsCount: Number(item.comments_count) || 0,
      reach: postInsights.reach || 0,
      saved: postInsights.saved || 0,
      shares: postInsights.shares || 0,
      views: postInsights.views || 0,
    };
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const syncedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // 5. Update Dashboard KPIs
  writeInstagramDashboardKpis_(ss, {
    followers: Number(profile.followers_count) || 0,
    mediaCount: Number(profile.media_count) || 0,
    reach: Number(accountInsights.reach) || 0,
    profileViews: Number(accountInsights.profile_views) || 0,
    totalInteractions: Number(accountInsights.total_interactions) || 0,
    lastSynced: syncedAt,
  });

  // 6. Upsert Content Performance rows
  const upsertSummary = upsertInstagramContentRows_(ss, enrichedPosts);
  Logger.log('Instagram sync complete. Updated: ' + upsertSummary.updated
    + ', Inserted: ' + upsertSummary.inserted + ', Synced at: ' + syncedAt);

  return {
    ok: true,
    username: profile.username || '',
    followers: Number(profile.followers_count) || 0,
    mediaCount: Number(profile.media_count) || 0,
    postsSynced: enrichedPosts.length,
    updated: upsertSummary.updated,
    inserted: upsertSummary.inserted,
    syncedAt: syncedAt,
  };
}

/**
 * Performs a GET request to the Meta Graph API with try/catch and clean error extraction.
 * Never includes access_token in logs or thrown error messages.
 */
function fetchMetaGraphJson_(url, contextLabel) {
  let response;
  try {
    response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
    });
  } catch (err) {
    const msg = 'Network error fetching Meta Graph API (' + contextLabel + '): ' + (err.message || String(err));
    Logger.log(msg);
    throw new Error(msg);
  }

  const statusCode = response.getResponseCode();
  const rawText = response.getContentText();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch (parseErr) {
    const msg = 'Invalid JSON response from Meta Graph API (' + contextLabel + ', HTTP ' + statusCode + ').';
    Logger.log(msg);
    throw new Error(msg);
  }

  if (statusCode >= 400 || (json && json.error)) {
    const apiErrMsg = formatMetaApiError_(json, statusCode);
    Logger.log('Meta Graph API error (' + contextLabel + '): ' + apiErrMsg);
    throw new Error('Meta Graph API error (' + contextLabel + '): ' + apiErrMsg);
  }

  return json;
}

/**
 * Fetches per-post insights, gracefully handling metric differences between REELS and IMAGE/CAROUSEL_ALBUM.
 */
function fetchMediaInsightsGracefully_(mediaItem, accessToken) {
  const mediaId = String(mediaItem.id || '').trim();
  if (!mediaId) return { reach: 0, saved: 0, shares: 0, views: 0 };

  const metricSets = ['reach,saved,shares,views', 'reach,saved'];

  for (let i = 0; i < metricSets.length; i++) {
    const metricsParam = metricSets[i];
    const url = IG_GRAPH_BASE_URL + encodeURIComponent(mediaId)
      + '/insights?metric=' + metricsParam
      + '&access_token=' + encodeURIComponent(accessToken);

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        muteHttpExceptions: true,
      });
      const statusCode = response.getResponseCode();
      const json = JSON.parse(response.getContentText() || '{}');

      if (statusCode < 400 && !json.error) {
        const parsed = parseInsightsMap_(json.data);
        return {
          reach: parsed.reach || 0,
          saved: parsed.saved || 0,
          shares: parsed.shares || 0,
          views: parsed.views || 0,
        };
      }

      Logger.log('Insights unavailable for media ' + mediaId
        + ' (' + (mediaItem.media_product_type || mediaItem.media_type || 'UNKNOWN') + ')'
        + ' with metrics [' + metricsParam + ']: ' + formatMetaApiError_(json, statusCode));
    } catch (err) {
      Logger.log('Error fetching insights for media ' + mediaId
        + ' with metrics [' + metricsParam + ']: ' + (err.message || String(err)));
    }
  }

  return { reach: 0, saved: 0, shares: 0, views: 0 };
}

/**
 * Extracts a clean error description from a Meta Graph API error payload.
 */
function formatMetaApiError_(json, statusCode) {
  if (json && json.error) {
    const e = json.error;
    const parts = [];
    if (e.message) parts.push(e.message);
    if (e.type) parts.push('type=' + e.type);
    if (e.code !== undefined) parts.push('code=' + e.code);
    if (e.error_subcode !== undefined) parts.push('subcode=' + e.error_subcode);
    if (parts.length > 0) return parts.join(' | ');
  }
  return 'HTTP ' + statusCode;
}

/**
 * Converts a Meta insights `data` array into a { metricName: number } map.
 */
function parseInsightsMap_(insightsData) {
  const result = {};
  if (!Array.isArray(insightsData)) return result;

  insightsData.forEach(function (entry) {
    if (!entry || !entry.name) return;
    if (entry.total_value && typeof entry.total_value.value === 'number') {
      result[entry.name] = entry.total_value.value;
    } else if (Array.isArray(entry.values) && entry.values.length > 0) {
      let sum = 0;
      let hasNumeric = false;
      entry.values.forEach(function (v) {
        if (v && typeof v.value === 'number') {
          sum += v.value;
          hasNumeric = true;
        }
      });
      if (hasNumeric) result[entry.name] = sum;
    }
  });

  return result;
}

/**
 * Writes account-level Instagram KPIs into "Goals & Baseline Dashboard"
 * without overwriting manual formulas or existing cell styling.
 */
function writeInstagramDashboardKpis_(ss, kpis) {
  const sheet = ss.getSheetByName(SHEET_NAMES.GOALS);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAMES.GOALS);

  const kpiSpecs = [
    {
      defaultLabel: 'Instagram Followers',
      patterns: ['instagram followers', 'ig followers'],
      value: kpis.followers,
    },
    {
      defaultLabel: 'Instagram Media Count',
      patterns: ['instagram media count', 'ig media count', 'media count'],
      value: kpis.mediaCount,
    },
    {
      defaultLabel: 'Instagram Reach',
      patterns: ['instagram reach', 'ig reach', 'account reach'],
      value: kpis.reach,
    },
    {
      defaultLabel: 'Instagram Profile Views',
      patterns: ['instagram profile views', 'ig profile views', 'profile views'],
      value: kpis.profileViews,
    },
    {
      defaultLabel: 'Instagram Total Interactions',
      patterns: ['instagram total interactions', 'ig total interactions', 'total interactions'],
      value: kpis.totalInteractions,
    },
    {
      defaultLabel: 'Instagram Last Synced',
      patterns: ['instagram last synced', 'ig last synced', 'last synced'],
      value: kpis.lastSynced,
    },
  ];

  const data = sheet.getDataRange().getValues();
  const formulas = sheet.getDataRange().getFormulas();

  kpiSpecs.forEach(function (spec) {
    let matchedRowIndex = -1;
    for (let r = 0; r < data.length; r++) {
      const label = String(data[r][0] || data[r][1] || '').toLowerCase();
      if (!label) continue;
      if (spec.patterns.some(function (p) { return label.indexOf(p) !== -1; })) {
        matchedRowIndex = r;
        break;
      }
    }

    if (matchedRowIndex !== -1) {
      const existingFormula = formulas[matchedRowIndex] && formulas[matchedRowIndex][2];
      if (existingFormula) {
        Logger.log('Skipping formula cell at ' + SHEET_NAMES.GOALS + '!C' + (matchedRowIndex + 1)
          + ' for "' + spec.defaultLabel + '".');
        return;
      }
      sheet.getRange(matchedRowIndex + 1, 3).setValue(spec.value);
    } else {
      sheet.appendRow([spec.defaultLabel, '', spec.value]);
    }
  });
}

/**
 * Upserts Instagram posts/reels into "Content Performance", matching by Post ID.
 * Dynamically locates the table header row (e.g. Row 10) and "Total / Average"
 * summary row so existing columns, formatting, formulas, and manual notes stay intact.
 */
function upsertInstagramContentRows_(ss, posts) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTENT);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAMES.CONTENT);

  const defaultHeaders = [
    'Date / Post', 'Hook (Text on Screen)', 'Content / Visual Description',
    'Song Promoted', 'Views', 'Likes', 'Comments', 'Shares',
    'Saves / Reposts', 'Total Engagements', 'Engagement Rate',
    'Campaign & Audio Focus', 'Post ID', 'Permalink',
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(defaultHeaders);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight('bold');
  }

  const headerInfo = findContentHeaderRow_(sheet);
  const headerRowNum = headerInfo.rowNum;
  let lastCol = headerInfo.lastCol;
  const headerRow = headerInfo.headers;

  const findHeaderCol = function (names) {
    for (let c = 0; c < headerRow.length; c++) {
      const h = headerRow[c].toLowerCase();
      if (!h) continue;
      for (let n = 0; n < names.length; n++) {
        if (h === names[n] || h.indexOf(names[n]) !== -1) {
          return c + 1;
        }
      }
    }
    return -1;
  };

  const appendHeaderCol = function (title) {
    const newCol = lastCol + 1;
    while (sheet.getMaxColumns() < newCol) {
      sheet.insertColumnAfter(sheet.getMaxColumns());
    }
    const prevHeaderCell = sheet.getRange(headerRowNum, lastCol);
    const newHeaderCell = sheet.getRange(headerRowNum, newCol);
    prevHeaderCell.copyTo(newHeaderCell, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    newHeaderCell.setValue(title).setFontWeight('bold');
    headerRow.push(title);
    lastCol = newCol;
    return newCol;
  };

  const colDate = findHeaderCol(['date / post', 'date']);
  const colHook = findHeaderCol(['hook (text on screen)', 'hook', 'caption/hook preview', 'caption']);
  const colFormat = findHeaderCol(['format']);
  const colVisualDesc = findHeaderCol(['content / visual description', 'visual description']);
  const colSong = findHeaderCol(['song promoted', 'song']);
  const colViews = findHeaderCol(['views/reach', 'views']);
  const colLikes = findHeaderCol(['likes']);
  const colComments = findHeaderCol(['comments']);
  const colShares = findHeaderCol(['shares']);
  const colSaves = findHeaderCol(['saves / reposts', 'saves', 'saved']);
  const colTotalEng = findHeaderCol(['total engagements', 'total engagement']);
  const colEr = findHeaderCol(['engagement rate %', 'engagement rate', 'er']);

  let colPostId = findHeaderCol(['post id', 'post_id', 'ig post id']);
  if (colPostId === -1) {
    colPostId = appendHeaderCol('Post ID');
  }

  let colPermalink = findHeaderCol(['permalink', 'url', 'link']);
  if (colPermalink === -1) {
    colPermalink = appendHeaderCol('Permalink');
  }

  const firstDataRow = headerRowNum + 1;
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  const formulas = dataRange.getFormulas();

  const postIdToRow = {};
  let summaryRowNumber = -1; // 1-indexed row of Total / Average if present

  for (let r = headerRowNum; r < data.length; r++) {
    const labelA = String(data[r][0] || '').trim().toLowerCase();
    const labelB = String(data[r][1] || '').trim().toLowerCase();
    if (
      labelA.indexOf('total') === 0 || labelB.indexOf('total') === 0 ||
      labelA.indexOf('average') === 0 || labelB.indexOf('average') === 0
    ) {
      if (summaryRowNumber === -1) summaryRowNumber = r + 1;
    }

    const existingPostId = String(data[r][colPostId - 1] || '').trim();
    if (existingPostId) {
      postIdToRow[existingPostId] = r + 1;
    }
  }

  // Use the first existing data row as the formatting template for new rows
  const templateRowNum = (summaryRowNumber === -1 || firstDataRow < summaryRowNumber)
    ? firstDataRow
    : -1;

  let updated = 0;
  let inserted = 0;

  posts.forEach(function (post) {
    if (!post.id) return;

    const format = formatIgMediaType_(post.mediaProductType, post.mediaType);
    const dateStr = formatIgTimestamp_(post.timestamp);
    const hookPreview = formatCaptionPreview_(post.caption, format + ' (' + dateStr + ')');
    const viewsOrReach = post.views > 0 ? post.views : post.reach;
    const totalEngagement = post.likeCount + post.commentsCount + post.shares + post.saved;
    const erDecimal = viewsOrReach > 0 ? totalEngagement / viewsOrReach : 0;

    let targetRow = postIdToRow[post.id];
    const isUpdate = Boolean(targetRow);

    if (!isUpdate) {
      if (summaryRowNumber !== -1) {
        sheet.insertRowBefore(summaryRowNumber);
        targetRow = summaryRowNumber;
        summaryRowNumber += 1;
      } else {
        targetRow = sheet.getLastRow() + 1;
        if (sheet.getMaxRows() < targetRow) {
          sheet.insertRowsAfter(sheet.getMaxRows(), targetRow - sheet.getMaxRows());
        }
      }
      if (templateRowNum !== -1 && templateRowNum !== targetRow && templateRowNum <= sheet.getMaxRows()) {
        const copyCols = Math.min(lastCol, sheet.getMaxColumns());
        sheet.getRange(templateRowNum, 1, 1, copyCols)
          .copyTo(sheet.getRange(targetRow, 1, 1, copyCols), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
        sheet.setRowHeight(targetRow, sheet.getRowHeight(templateRowNum));
      } else {
        const copyCols = Math.min(lastCol, sheet.getMaxColumns());
        sheet.getRange(targetRow, 2, 1, Math.max(copyCols - 1, 1))
          .setBackground('#ffffff')
          .setFontColor('#000000')
          .setFontWeight('normal');
      }
      postIdToRow[post.id] = targetRow;
      inserted += 1;
    } else {
      updated += 1;
    }

    const rowFormulas = isUpdate && formulas[targetRow - 1] ? formulas[targetRow - 1] : [];
    const setCellIfNotFormula = function (col, val, numberFormat) {
      if (!col || col < 1) return;
      if (rowFormulas[col - 1]) return;
      const cell = sheet.getRange(targetRow, col);
      if (numberFormat) {
        cell.setNumberFormat(numberFormat);
      }
      cell.setValue(val);
    };

    setCellIfNotFormula(colDate, dateStr, 'yyyy-mm-dd');
    setCellIfNotFormula(colHook, hookPreview);
    if (colHook > 0) {
      sheet.getRange(targetRow, colHook).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    }
    if (colFormat > 0) {
      setCellIfNotFormula(colFormat, format);
    } else if (colVisualDesc > 0 && !isUpdate) {
      setCellIfNotFormula(colVisualDesc, format);
    }
    if (!isUpdate && colSong > 0) {
      setCellIfNotFormula(colSong, '');
    }
    setCellIfNotFormula(colViews, viewsOrReach, '#,##0');
    setCellIfNotFormula(colLikes, post.likeCount, '#,##0');
    setCellIfNotFormula(colComments, post.commentsCount, '#,##0');
    setCellIfNotFormula(colShares, post.shares, '#,##0');
    setCellIfNotFormula(colSaves, post.saved, '#,##0');
    setCellIfNotFormula(colTotalEng, totalEngagement, '#,##0');
    setCellIfNotFormula(colEr, erDecimal, '0.0%');
    setCellIfNotFormula(colPostId, String(post.id), '@');
    setCellIfNotFormula(colPermalink, post.permalink);
    if (colPermalink > 0) {
      sheet.getRange(targetRow, colPermalink).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    }
  });

  // Refresh Total / Average row SUM formulas dynamically using actual column positions
  if (summaryRowNumber !== -1 && summaryRowNumber > firstDataRow) {
    const lastDataRow = summaryRowNumber - 1;
    [colViews, colLikes, colComments, colShares, colSaves, colTotalEng].forEach(function (col) {
      if (col > 0) {
        const colLetter = columnToLetter_(col);
        sheet.getRange(summaryRowNumber, col)
          .setFormula('=SUM(' + colLetter + firstDataRow + ':' + colLetter + lastDataRow + ')');
      }
    });
    if (colEr > 0 && colViews > 0 && colTotalEng > 0) {
      const viewsLetter = columnToLetter_(colViews);
      const engLetter = columnToLetter_(colTotalEng);
      sheet.getRange(summaryRowNumber, colEr)
        .setFormula('=IF(' + viewsLetter + summaryRowNumber + '>0,' + engLetter + summaryRowNumber + '/' + viewsLetter + summaryRowNumber + ',0)')
        .setNumberFormat('0.0%');
    }
  }

  return { updated: updated, inserted: inserted };
}

/**
 * Locates the table header row in "Content Performance" (e.g. Row 10).
 */
function findContentHeaderRow_(sheet) {
  const maxScanRows = Math.min(Math.max(sheet.getLastRow(), 1), 25);
  const maxScanCols = Math.min(Math.max(sheet.getLastColumn(), 1), sheet.getMaxColumns());
  const grid = sheet.getRange(1, 1, maxScanRows, maxScanCols).getValues();

  for (let r = 0; r < grid.length; r++) {
    const rowStrings = grid[r].map(function (v) { return String(v || '').trim(); });
    const lower = rowStrings.map(function (s) { return s.toLowerCase(); });
    const hasDate = lower.some(function (s) { return s === 'date' || s.indexOf('date /') === 0; });
    const hasViewsOrLikes = lower.some(function (s) { return s === 'views' || s === 'likes'; });
    if (hasDate && hasViewsOrLikes) {
      let lastCol = rowStrings.length;
      while (lastCol > 1 && !rowStrings[lastCol - 1]) {
        lastCol--;
      }
      return {
        rowNum: r + 1,
        lastCol: lastCol,
        headers: rowStrings.slice(0, lastCol),
      };
    }
  }

  const fallbackCols = Math.min(Math.max(sheet.getLastColumn(), 1), sheet.getMaxColumns());
  const fallbackRow = sheet.getRange(1, 1, 1, fallbackCols).getValues()[0].map(function (v) {
    return String(v || '').trim();
  });
  return { rowNum: 1, lastCol: fallbackCols, headers: fallbackRow };
}

/**
 * Converts a 1-indexed column number (e.g. 6) to a Sheet column letter (e.g. "F").
 */
function columnToLetter_(col) {
  let letter = '';
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function formatIgMediaType_(productType, mediaType) {
  if (productType === 'REELS') return 'Reel';
  if (mediaType === 'CAROUSEL_ALBUM') return 'Carousel';
  if (mediaType === 'VIDEO') return 'Video';
  if (mediaType === 'IMAGE') return 'Image';
  return productType || mediaType || 'Post';
}

function formatIgTimestamp_(isoString) {
  if (!isoString) {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const normalized = String(isoString).replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return String(isoString).slice(0, 10);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatCaptionPreview_(caption, fallback) {
  const cleaned = String(caption || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= 100) return cleaned;
  return cleaned.slice(0, 97) + '...';
}
