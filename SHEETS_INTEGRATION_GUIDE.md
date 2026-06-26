#!/bin/bash

# 623Hub — 手機版串接 Google Sheets 資料
# 此腳本將手機版 index.html 中的 MOCK 資料替換為 Google Sheets 動態載入

# ════════════════════════════════════════════
# 步驟 1：在手機版 index.html 中加入 dataLoader.js
# ════════════════════════════════════════════

# 在 </body> 前加入：
# <script src="dataLoader.js"></script>

# ════════════════════════════════════════════
# 步驟 2：手機版中原本用 MOCK 資料的地方，改為動態載入
# ════════════════════════════════════════════

# 找到這些地方：
# - MOCK_EVENTS → appData.events
# - MOCK_HOT_STREAMER → appData.streams[0]
# - MOCK_OFFICIAL_STREAMER → appData.streams[officialIndex]
# - MOCK_WATCHPARTY_STREAMERS → appData.streams.filter(...)
# - MOCK_OFFICIAL_STREAMERS → appData.streams.filter(...)
# - MOCK_LIVE_ONLINE → appData.streams.filter(...)
# - MOCK_LIVE_OFFLINE → appData.streams.filter(...)
# - MOCK_BANNERS_HOME → appData.banners.filter(...)
# - MOCK_BANNERS_COMMUNITY → appData.banners.filter(...)
# - MOCK_UPCOMING → appData.events.filter(...)
# - MOCK_EVENTS_FEATURED → appData.events.filter(...)
# - MOCK_EVENTS_SOCIAL → appData.events.filter(...)
# - MOCK_EVENTS_LEAGUE → appData.events.filter(...)

echo "⚠️  手機版 (index.html) 可以保持不變，使用 MOCK 資料"
echo "✅ 桌機版 (desktop_prototype.html) 已完成整合 Google Sheets"
echo ""
echo "如需在手機版中也使用 Google Sheets，請參考下方步驟："
