// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: chart-line;

/**
 * LXG Dashboard — Scriptable iOS Widget
 *
 * Setup:
 * 1. Paste your Google Apps Script Web App URL and Secret Key below.
 * 2. Add a Scriptable widget to your iOS Home Screen (Small, Medium, or Large).
 * 3. (Optional) Long-press the widget -> Edit Widget -> Parameter to customize:
 *    - Presets: "overview" (default), "spotify", "instagram", "goals"
 *    - Custom metrics (comma-separated):
 *      listeners, spotify, ig, streams, releases, top_single,
 *      reel_views, reels, avg_er, monthly_goal, ultimate_goal, portfolio
 *    - Options (after "|"): title=My Title, goal=10000
 *      Example: "spotify|title=Spotify" or "listeners,ig,reel_views,avg_er"
 */

// ============================================================================
// CONFIGURATION — Edit these two values with your LXG Dashboard sync settings
// ============================================================================
const CONFIG = {
  webAppUrl: "https://script.google.com/macros/s/AKfycby1XWa4HteR36VUwHscG2KlrB-FFnVTpDxmrlwB7oT7PchVKii2JWhr0LPqWvX6mlpT/exec",
  secretKey: "PASTE_YOUR_SECRET_KEY_HERE",
  defaultMonthlyGoal: 10000,
  ultimateGoal: 100000,
  previewSize: "medium", // "small" | "medium" | "large" when run inside Scriptable
};

// ============================================================================
// THEME & COLORS
// ============================================================================
const THEME = {
  bgTop: new Color("#0B0F17"),
  bgBottom: new Color("#131B2B"),
  cardBg: new Color("#1A2336", 0.9),
  textPrimary: new Color("#F8FAFC"),
  textSecondary: new Color("#94A3B8"),
  textMuted: new Color("#64748B"),
  accentBlue: new Color("#38BDF8"),
  accentGreen: new Color("#1DB954"),
  accentPink: new Color("#E1306C"),
  accentPurple: new Color("#A855F7"),
  accentAmber: new Color("#F59E0B"),
  accentRed: new Color("#EF4444"),
  progressTrack: new Color("#273248"),
};

// ============================================================================
// PARAMETER PARSING
// ============================================================================
function parseWidgetParameter(rawParam) {
  const result = {
    preset: "overview",
    customKeys: null,
    title: "LXG DASHBOARD",
    goalOverride: null,
  };

  if (!rawParam || !rawParam.trim()) return result;

  const parts = rawParam.split("|").map((p) => p.trim()).filter(Boolean);
  const mainPart = parts[0] || "";

  const presets = ["overview", "spotify", "instagram", "goals"];
  const lowerMain = mainPart.toLowerCase();

  if (presets.includes(lowerMain)) {
    result.preset = lowerMain;
  } else if (mainPart.length > 0 && !mainPart.includes("=")) {
    result.customKeys = mainPart
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
  }

  // Parse key=value options from any segment
  const optionSegments = mainPart.includes("=") ? parts : parts.slice(1);
  for (const seg of optionSegments) {
    const eqIdx = seg.indexOf("=");
    if (eqIdx === -1) continue;
    const k = seg.slice(0, eqIdx).trim().toLowerCase();
    const v = seg.slice(eqIdx + 1).trim();
    if (k === "title" && v) result.title = v;
    if (k === "goal" && !isNaN(Number(v)) && Number(v) > 0) {
      result.goalOverride = Number(v);
    }
  }

  return result;
}

// ============================================================================
// DATA FETCHING & OFFLINE CACHE
// ============================================================================
const CACHE_FILE = "lxg-dashboard-cache.json";

function getCachePath() {
  const fm = FileManager.local();
  return fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
}

function readCache() {
  try {
    const fm = FileManager.local();
    const path = getCachePath();
    if (!fm.fileExists(path)) return null;
    const raw = fm.readString(path);
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function writeCache(state) {
  try {
    const fm = FileManager.local();
    const path = getCachePath();
    fm.writeString(
      path,
      JSON.stringify({
        state,
        cachedAt: new Date().toISOString(),
      })
    );
  } catch (_) {
    // Ignore cache write errors
  }
}

async function fetchDashboardState() {
  const url = CONFIG.webAppUrl.trim();
  const key = CONFIG.secretKey.trim();

  if (!url || url.includes("PASTE_YOUR_WEB_APP_URL_HERE") || !key || key.includes("PASTE_YOUR_SECRET_KEY_HERE")) {
    return {
      ok: false,
      error: "Setup required: add your webAppUrl and secretKey in the script.",
      state: null,
      isCached: false,
    };
  }

  const sep = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${sep}key=${encodeURIComponent(key)}`;

  try {
    const req = new Request(fullUrl);
    req.method = "GET";
    req.timeoutInterval = 12;
    const json = await req.loadJSON();

    if (!json || json.ok !== true || !json.state) {
      throw new Error((json && json.error) || "Invalid response from Apps Script");
    }

    writeCache(json.state);
    return {
      ok: true,
      state: json.state,
      isCached: false,
      timestamp: json.state.syncedAt || new Date().toISOString(),
    };
  } catch (err) {
    const cached = readCache();
    if (cached && cached.state) {
      return {
        ok: true,
        state: cached.state,
        isCached: true,
        timestamp: cached.cachedAt || cached.state.syncedAt,
        error: err.message || String(err),
      };
    }
    return {
      ok: false,
      error: err.message || "Network error",
      state: null,
      isCached: false,
    };
  }
}

// ============================================================================
// METRIC COMPUTATION & FORMATTING
// ============================================================================
function formatInt(val) {
  const num = Number(val) || 0;
  return Math.round(num).toLocaleString("en-US");
}

function formatCompact(val) {
  const num = Number(val) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return Math.round(num).toLocaleString("en-US");
}

function buildMetricsMap(state, params) {
  const m = state.metrics || {};
  const reels = Array.isArray(state.reels) ? state.reels : [];

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const monthReels = reels.filter((r) => {
    if (!r || !r.date) return false;
    const d = new Date(r.date);
    return !isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  const monthReelViews = monthReels.reduce((sum, r) => sum + (Number(r.views) || 0), 0);
  const monthAvgEr =
    monthReels.length > 0
      ? monthReels.reduce((sum, r) => sum + (Number(r.engagementRate) || 0), 0) / monthReels.length
      : 0;

  const monthlyGoal =
    params.goalOverride ||
    (state.monthlyListenerGoal && state.monthlyListenerGoal > 0
      ? state.monthlyListenerGoal
      : CONFIG.defaultMonthlyGoal);

  const listeners = Number(m.monthlyListeners) || 0;
  const monthlyPct = Math.min(100, Math.round((listeners / monthlyGoal) * 100));
  const ultimatePct = Math.min(100, (listeners / CONFIG.ultimateGoal) * 100);
  const portfolioPct = Number(m.overallPortfolioProgress) || 0;

  return {
    listeners: {
      key: "listeners",
      label: "Monthly Listeners",
      shortLabel: "Listeners",
      value: formatInt(listeners),
      compactValue: formatCompact(listeners),
      sub: `${monthlyPct}% of ${formatCompact(monthlyGoal)}`,
      color: THEME.accentGreen,
      progress: monthlyPct / 100,
    },
    spotify: {
      key: "spotify",
      label: "Spotify Followers",
      shortLabel: "Spotify",
      value: formatInt(m.spotifyFollowers),
      compactValue: formatCompact(m.spotifyFollowers),
      color: THEME.accentGreen,
    },
    ig: {
      key: "ig",
      label: "IG Followers",
      shortLabel: "IG Followers",
      value: formatInt(m.instagramFollowers),
      compactValue: formatCompact(m.instagramFollowers),
      color: THEME.accentPink,
    },
    streams: {
      key: "streams",
      label: "All-Time Streams",
      shortLabel: "All-Time",
      value: formatInt(m.allTimeStreams),
      compactValue: formatCompact(m.allTimeStreams),
      color: THEME.accentBlue,
    },
    releases: {
      key: "releases",
      label: "Catalog Releases",
      shortLabel: "Releases",
      value: formatInt(m.catalogReleases),
      compactValue: formatInt(m.catalogReleases),
      color: THEME.accentPurple,
    },
    top_single: {
      key: "top_single",
      label: m.topSingleName ? `Top: ${m.topSingleName}` : "Top Single",
      shortLabel: "Top Single",
      value: formatInt(m.topSingleStreams),
      compactValue: formatCompact(m.topSingleStreams),
      color: THEME.accentGreen,
    },
    reel_views: {
      key: "reel_views",
      label: "Reel Views (Mo)",
      shortLabel: "Reel Views",
      value: formatInt(monthReelViews),
      compactValue: formatCompact(monthReelViews),
      color: THEME.accentPink,
    },
    reels: {
      key: "reels",
      label: "Reels (Mo)",
      shortLabel: "Reels",
      value: formatInt(monthReels.length),
      compactValue: formatInt(monthReels.length),
      color: THEME.accentPink,
    },
    avg_er: {
      key: "avg_er",
      label: "Avg Reel ER",
      shortLabel: "Avg ER",
      value: `${monthAvgEr.toFixed(1)}%`,
      compactValue: `${monthAvgEr.toFixed(1)}%`,
      color: THEME.accentAmber,
    },
    monthly_goal: {
      key: "monthly_goal",
      label: "Monthly Goal",
      shortLabel: "Mo Goal",
      value: `${monthlyPct}%`,
      compactValue: `${monthlyPct}%`,
      sub: `${formatCompact(listeners)} / ${formatCompact(monthlyGoal)}`,
      color: THEME.accentGreen,
      progress: monthlyPct / 100,
    },
    ultimate_goal: {
      key: "ultimate_goal",
      label: "Ultimate Goal",
      shortLabel: "Ultimate",
      value: `${ultimatePct.toFixed(1)}%`,
      compactValue: `${ultimatePct.toFixed(1)}%`,
      sub: `Target ${formatCompact(CONFIG.ultimateGoal)}`,
      color: THEME.accentBlue,
      progress: ultimatePct / 100,
    },
    portfolio: {
      key: "portfolio",
      label: "Portfolio Progress",
      shortLabel: "Portfolio",
      value: `${portfolioPct.toFixed(1)}%`,
      compactValue: `${portfolioPct.toFixed(1)}%`,
      color: THEME.accentPurple,
      progress: Math.min(1, portfolioPct / 100),
    },
  };
}

function getPresetKeys(preset) {
  switch (preset) {
    case "spotify":
      return ["listeners", "spotify", "top_single", "streams", "monthly_goal", "releases"];
    case "instagram":
      return ["ig", "reel_views", "reels", "avg_er", "listeners", "monthly_goal"];
    case "goals":
      return ["listeners", "monthly_goal", "ultimate_goal", "portfolio", "streams", "releases"];
    case "overview":
    default:
      return ["listeners", "spotify", "ig", "reel_views", "avg_er", "streams", "reels", "portfolio"];
  }
}

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ============================================================================
// UI HELPERS
// ============================================================================
function createBaseWidget() {
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.locations = [0, 1];
  grad.colors = [THEME.bgTop, THEME.bgBottom];
  w.backgroundGradient = grad;
  w.setPadding(14, 14, 14, 14);
  return w;
}

function addHeader(widget, title, isCached, timestamp, compact = false) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const titleTxt = row.addText(title);
  titleTxt.font = Font.boldSystemFont(compact ? 11 : 12);
  titleTxt.textColor = THEME.accentBlue;
  titleTxt.lineLimit = 1;

  row.addSpacer();

  const timeLabel = formatTimeAgo(timestamp);
  const statusText = isCached ? `Offline • ${timeLabel}` : timeLabel;
  if (statusText) {
    const status = row.addText(statusText);
    status.font = Font.mediumSystemFont(10);
    status.textColor = isCached ? THEME.accentAmber : THEME.textMuted;
    status.lineLimit = 1;
  }
}

function addProgressBar(parent, ratio, color, width = 120, height = 5) {
  const clamped = Math.max(0, Math.min(1, ratio || 0));
  const track = parent.addStack();
  track.size = new Size(width, height);
  track.backgroundColor = THEME.progressTrack;
  track.cornerRadius = height / 2;
  track.layoutHorizontally();

  const fillWidth = Math.max(height, Math.round(width * clamped));
  if (clamped > 0) {
    const fill = track.addStack();
    fill.size = new Size(fillWidth, height);
    fill.backgroundColor = color;
    fill.cornerRadius = height / 2;
  }
  track.addSpacer();
}

function addMetricCard(parent, metric, compact = false) {
  const card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = THEME.cardBg;
  card.cornerRadius = 10;
  card.setPadding(compact ? 7 : 9, compact ? 9 : 11, compact ? 7 : 9, compact ? 9 : 11);

  const label = card.addText(compact ? metric.shortLabel : metric.label);
  label.font = Font.mediumSystemFont(compact ? 10 : 11);
  label.textColor = THEME.textSecondary;
  label.lineLimit = 1;

  card.addSpacer(2);

  const val = card.addText(compact ? metric.compactValue : metric.value);
  val.font = Font.boldSystemFont(compact ? 15 : 17);
  val.textColor = THEME.textPrimary;
  val.lineLimit = 1;
  val.minimumScaleFactor = 0.7;

  if (metric.sub && !compact) {
    card.addSpacer(2);
    const sub = card.addText(metric.sub);
    sub.font = Font.mediumSystemFont(9);
    sub.textColor = metric.color || THEME.textMuted;
    sub.lineLimit = 1;
  }

  return card;
}

// ============================================================================
// WIDGET LAYOUTS (SMALL / MEDIUM / LARGE / ERROR)
// ============================================================================
function renderErrorWidget(errorMsg) {
  const w = createBaseWidget();
  addHeader(w, "LXG DASHBOARD", false, null, true);
  w.addSpacer();

  const icon = w.addText("⚠️ Unable to load data");
  icon.font = Font.semiboldSystemFont(13);
  icon.textColor = THEME.accentAmber;

  w.addSpacer(4);

  const msg = w.addText(errorMsg || "Check your Web App URL and Secret Key.");
  msg.font = Font.regularSystemFont(11);
  msg.textColor = THEME.textSecondary;
  msg.lineLimit = 4;

  w.addSpacer();
  return w;
}

function renderSmallWidget(metricsMap, keys, params, isCached, timestamp) {
  const w = createBaseWidget();
  addHeader(w, "LXG", isCached, timestamp, true);
  w.addSpacer(6);

  const hero = metricsMap[keys[0]] || metricsMap.listeners;
  const heroLabel = w.addText(hero.shortLabel);
  heroLabel.font = Font.mediumSystemFont(11);
  heroLabel.textColor = THEME.textSecondary;
  heroLabel.lineLimit = 1;

  const heroVal = w.addText(hero.value);
  heroVal.font = Font.boldSystemFont(24);
  heroVal.textColor = THEME.textPrimary;
  heroVal.minimumScaleFactor = 0.65;
  heroVal.lineLimit = 1;

  if (typeof hero.progress === "number") {
    w.addSpacer(4);
    addProgressBar(w, hero.progress, hero.color, 125, 5);
    if (hero.sub) {
      w.addSpacer(2);
      const sub = w.addText(hero.sub);
      sub.font = Font.mediumSystemFont(9);
      sub.textColor = hero.color;
      sub.lineLimit = 1;
    }
  }

  w.addSpacer();

  const row = w.addStack();
  row.layoutHorizontally();
  const second = metricsMap[keys[1]] || metricsMap.spotify;
  const third = metricsMap[keys[2]] || metricsMap.ig;

  const col1 = row.addStack();
  col1.layoutVertically();
  const l1 = col1.addText(second.shortLabel);
  l1.font = Font.mediumSystemFont(9);
  l1.textColor = THEME.textMuted;
  const v1 = col1.addText(second.compactValue);
  v1.font = Font.boldSystemFont(13);
  v1.textColor = THEME.textPrimary;

  row.addSpacer();

  const col2 = row.addStack();
  col2.layoutVertically();
  const l2 = col2.addText(third.shortLabel);
  l2.font = Font.mediumSystemFont(9);
  l2.textColor = THEME.textMuted;
  const v2 = col2.addText(third.compactValue);
  v2.font = Font.boldSystemFont(13);
  v2.textColor = THEME.textPrimary;

  return w;
}

function renderMediumWidget(metricsMap, keys, params, isCached, timestamp) {
  const w = createBaseWidget();
  addHeader(w, params.title, isCached, timestamp);
  w.addSpacer(8);

  const body = w.addStack();
  body.layoutHorizontally();
  body.centerAlignContent();

  // Left: Hero card
  const hero = metricsMap[keys[0]] || metricsMap.listeners;
  const left = body.addStack();
  left.layoutVertically();
  left.backgroundColor = THEME.cardBg;
  left.cornerRadius = 12;
  left.setPadding(10, 11, 10, 11);
  left.size = new Size(132, 102);

  const hLabel = left.addText(hero.label);
  hLabel.font = Font.mediumSystemFont(10);
  hLabel.textColor = THEME.textSecondary;
  hLabel.lineLimit = 1;

  left.addSpacer(4);

  const hVal = left.addText(hero.value);
  hVal.font = Font.boldSystemFont(22);
  hVal.textColor = THEME.textPrimary;
  hVal.minimumScaleFactor = 0.6;
  hVal.lineLimit = 1;

  left.addSpacer();

  if (typeof hero.progress === "number") {
    addProgressBar(left, hero.progress, hero.color, 110, 5);
    left.addSpacer(4);
  }
  if (hero.sub) {
    const hSub = left.addText(hero.sub);
    hSub.font = Font.mediumSystemFont(10);
    hSub.textColor = hero.color || THEME.textMuted;
    hSub.lineLimit = 1;
  }

  body.addSpacer(8);

  // Right: 2x2 grid
  const right = body.addStack();
  right.layoutVertically();

  const gridKeys = keys.slice(1, 5);
  const topRow = right.addStack();
  topRow.layoutHorizontally();
  if (gridKeys[0] && metricsMap[gridKeys[0]]) {
    const c = addMetricCard(topRow, metricsMap[gridKeys[0]], true);
    c.size = new Size(84, 48);
  }
  topRow.addSpacer(6);
  if (gridKeys[1] && metricsMap[gridKeys[1]]) {
    const c = addMetricCard(topRow, metricsMap[gridKeys[1]], true);
    c.size = new Size(84, 48);
  }

  right.addSpacer(6);

  const botRow = right.addStack();
  botRow.layoutHorizontally();
  if (gridKeys[2] && metricsMap[gridKeys[2]]) {
    const c = addMetricCard(botRow, metricsMap[gridKeys[2]], true);
    c.size = new Size(84, 48);
  }
  botRow.addSpacer(6);
  if (gridKeys[3] && metricsMap[gridKeys[3]]) {
    const c = addMetricCard(botRow, metricsMap[gridKeys[3]], true);
    c.size = new Size(84, 48);
  }

  return w;
}

function renderLargeWidget(metricsMap, keys, params, isCached, timestamp) {
  const w = createBaseWidget();
  addHeader(w, params.title, isCached, timestamp);
  w.addSpacer(10);

  // Hero banner
  const hero = metricsMap[keys[0]] || metricsMap.listeners;
  const heroCard = w.addStack();
  heroCard.layoutVertically();
  heroCard.backgroundColor = THEME.cardBg;
  heroCard.cornerRadius = 12;
  heroCard.setPadding(12, 14, 12, 14);

  const heroTop = heroCard.addStack();
  heroTop.layoutHorizontally();
  heroTop.centerAlignContent();

  const hLabel = heroTop.addText(hero.label);
  hLabel.font = Font.mediumSystemFont(12);
  hLabel.textColor = THEME.textSecondary;

  heroTop.addSpacer();

  if (hero.sub) {
    const hSub = heroTop.addText(hero.sub);
    hSub.font = Font.semiboldSystemFont(11);
    hSub.textColor = hero.color || THEME.accentGreen;
  }

  heroCard.addSpacer(4);

  const hVal = heroCard.addText(hero.value);
  hVal.font = Font.boldSystemFont(28);
  hVal.textColor = THEME.textPrimary;
  hVal.minimumScaleFactor = 0.7;

  if (typeof hero.progress === "number") {
    heroCard.addSpacer(6);
    addProgressBar(heroCard, hero.progress, hero.color, 270, 6);
  }

  w.addSpacer(10);

  // 2-column grid for remaining metrics (up to 6)
  const restKeys = keys.slice(1, 7).filter((k) => metricsMap[k]);
  for (let i = 0; i < restKeys.length; i += 2) {
    const row = w.addStack();
    row.layoutHorizontally();

    const c1 = addMetricCard(row, metricsMap[restKeys[i]], false);
    c1.size = new Size(146, 62);

    row.addSpacer(8);

    if (restKeys[i + 1]) {
      const c2 = addMetricCard(row, metricsMap[restKeys[i + 1]], false);
      c2.size = new Size(146, 62);
    }

    if (i + 2 < restKeys.length) {
      w.addSpacer(8);
    }
  }

  w.addSpacer();
  return w;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  const params = parseWidgetParameter(args.widgetParameter);
  const res = await fetchDashboardState();

  let widget;
  if (!res.ok || !res.state) {
    widget = renderErrorWidget(res.error);
  } else {
    const metricsMap = buildMetricsMap(res.state, params);
    const keys = (params.customKeys && params.customKeys.length > 0
      ? params.customKeys
      : getPresetKeys(params.preset)
    ).filter((k) => metricsMap[k]);

    const finalKeys = keys.length > 0 ? keys : getPresetKeys("overview");
    const family = config.widgetFamily || CONFIG.previewSize;

    if (family === "small") {
      widget = renderSmallWidget(metricsMap, finalKeys, params, res.isCached, res.timestamp);
    } else if (family === "large") {
      widget = renderLargeWidget(metricsMap, finalKeys, params, res.isCached, res.timestamp);
    } else {
      widget = renderMediumWidget(metricsMap, finalKeys, params, res.isCached, res.timestamp);
    }
  }

  // Refresh every 30 minutes
  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    const preview = CONFIG.previewSize;
    if (preview === "small") await widget.presentSmall();
    else if (preview === "large") await widget.presentLarge();
    else await widget.presentMedium();
  }

  Script.complete();
}

await main();
