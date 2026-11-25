# LXG Command — Google Sheets 60-Second Setup

Connect **LXG Command** directly to your **LXG Music - Growth & Goal Tracker** Google Sheet (no backend server required).

## 1. Open Apps Script
1. Open **LXG Music - Growth & Goal Tracker** in Google Sheets.
2. Click **Extensions → Apps Script**.
3. Delete any existing code in `Code.gs`, paste the contents of [`Code.gs`](./Code.gs), and press **Cmd+S** (Save).

## 2. Set Your Secret Sync Key
1. In the Apps Script left sidebar, click **Project Settings** (gear icon).
2. Scroll to **Script Properties → Add script property**.
3. Set:
   - **Property:** `SYNC_KEY`
   - **Value:** any secret passphrase you choose (e.g. `lxg-2027-secret`)
4. Click **Save script properties**.

## 3. Deploy as Web App
1. Click **Deploy → New deployment**.
2. Click the gear icon next to *Select type* and choose **Web app**.
3. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**, authorize the script when prompted, and copy the **Web app URL**.

## 4. Connect in LXG Command
1. Open **LXG Command** on your iPhone or browser and go to the **Account** tab.
2. Paste your **Web App URL** and **SYNC_KEY** into **Google Sheets Bridge Settings**.
3. Tap **Test & Sync Now**. The header pill will switch to **Live Synced**.
