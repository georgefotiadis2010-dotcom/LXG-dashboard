# LXG Dashboard — iPhone Widget (Scriptable)

Display your live LXG Dashboard metrics right on your iPhone Home Screen using the free **Scriptable** app.

- **Sizes:** Small, Medium, and Large
- **Customizable:** Pick a preset (`overview`, `spotify`, `instagram`, `goals`) or any custom list of metrics from the iOS **Edit Widget** screen
- **Offline-friendly:** Automatically caches your last successful sync and shows an `Offline` indicator if your phone has no connection

---

## Setup (3 Minutes)

### 1. Install Scriptable
Download **Scriptable** from the iOS App Store (free).

### 2. Add the Script
1. Open **Scriptable** on your iPhone and tap **+** (top right) to create a new script.
2. Copy the entire contents of [`lxg-dashboard-widget.js`](./lxg-dashboard-widget.js) and paste it into the new script.
3. At the top of the script, replace the two placeholder values in `CONFIG`:
   ```js
   const CONFIG = {
     webAppUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
     secretKey: "YOUR_SECRET_KEY",
     ...
   };
   ```
   *(You can find both of these in LXG Dashboard → **Account** → **Google Sheets Sync**.)*
4. Tap the **Play** button (bottom right) to preview the widget and confirm your live numbers load.
5. Tap **Done**, then rename the script to **LXG Dashboard**.

### 3. Add to Your Home Screen
1. Long-press an empty area on your iPhone Home Screen and tap **Edit → Add Widget** (or **+**).
2. Search for **Scriptable** and choose **Small**, **Medium**, or **Large**, then tap **Add Widget**.
3. Tap the new widget (or long-press → **Edit Widget**).
4. Set **Script** to **LXG Dashboard**.
5. *(Optional)* Set **Parameter** to customize what the widget shows (see below).

---

## Customizing via Widget Parameter

You can add multiple LXG widgets to your Home Screen, each showing different metrics, by setting the **Parameter** field in **Edit Widget**:

### Presets
- `overview` *(default)* — Monthly Listeners, Spotify Followers, IG Followers, Reel Views (Month), Avg ER, All-Time Streams
- `spotify` — Monthly Listeners, Spotify Followers, Top Single Streams, All-Time Streams, Monthly Goal %
- `instagram` — IG Followers, Reel Views (Month), Reels (Month), Avg ER, Monthly Listeners
- `goals` — Monthly Listeners, Monthly Goal %, Ultimate Goal %, Portfolio Progress %, All-Time Streams, Catalog Releases

### Custom Metric List
Pass a comma-separated list of any metric keys:
```text
listeners, spotify, ig, reel_views, avg_er
```

**Available metric keys:**
| Key | Metric |
| :--- | :--- |
| `listeners` | Monthly Listeners (+ Monthly Goal progress bar) |
| `spotify` | Spotify Followers |
| `ig` | Instagram Followers |
| `streams` | All-Time Streams |
| `releases` | Catalog Releases |
| `top_single` | Top Single Streams (with song name) |
| `reel_views` | Instagram Reel Views (this month) |
| `reels` | Instagram Reels count (this month) |
| `avg_er` | Instagram Avg Engagement Rate (this month) |
| `monthly_goal` | Monthly Listener Goal % |
| `ultimate_goal` | Ultimate Goal % (100K target) |
| `portfolio` | Overall Portfolio Progress % |

### Optional Modifiers
Append options after `|`:
- `title=Spotify` — Custom header title
- `goal=15000` — Override the monthly listener goal

**Examples:**
- `spotify|title=LXG Spotify`
- `listeners,ig,reel_views,avg_er|title=Growth`
- `goals|goal=25000`
