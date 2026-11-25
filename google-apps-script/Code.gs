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
    reels: readReels_(ss),
    weeklyLog: readWeeklyLog_(ss),
    checklist: readChecklist_(ss),
    syncedAt: new Date().toISOString(),
  };
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
 * Reads all Reel rows from "Content Performance".
 */
function readReels_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONTENT);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const reels = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const dateVal = row[0];
    const hook = String(row[1] || '').trim();
    if (!hook || hook.toLowerCase() === 'total' || hook.toLowerCase() === 'average') continue;

    const views = Number(row[4]) || 0;
    const likes = Number(row[5]) || 0;
    const comments = Number(row[6]) || 0;
    const shares = Number(row[7]) || 0;
    const saves = Number(row[8]) || 0;
    const erRaw = row[9];
    const er = erRaw !== '' && erRaw !== undefined
      ? Number(String(erRaw).replace('%', ''))
      : (views > 0 ? Number((((likes + comments + shares + saves) / views) * 100).toFixed(1)) : 0);

    reels.push({
      id: 'reel-' + r,
      date: dateVal instanceof Date ? Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(dateVal || ''),
      hook: hook,
      format: String(row[2] || ''),
      song: String(row[3] || ''),
      views: views,
      likes: likes,
      comments: comments,
      shares: shares,
      saves: saves,
      engagementRate: er,
      notes: String(row[10] || ''),
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
