/**
 * 623Hub — Google Sheets Data Loader
 * 從 Google Sheets CSV 匯出格式轉換為內部資料格式
 */

const DataLoader = (() => {
  // Sheets ID: 1MBU9FQYsPqEwSgdAjmfxzOETK8vmBPY_JeNkP6vNgCw
  const SHEET_ID = '1MBU9FQYsPqEwSgdAjmfxzOETK8vmBPY_JeNkP6vNgCw';

  // 各分頁的 GID（可以在 URL 中看到）
  // 改成你實際的 Sheet GID（如果不知道，用 0 代表預設分頁）
  const SHEET_GIDS = {
    events: 0,        // 賽事分頁
    streams: 1,       // 直播頻道分頁
    banners: 2,       // Banner 分頁
  };

  /**
   * 產生 Google Sheets CSV 匯出 URL
   */
  function getSheetUrl(gid) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  }

  /**
   * 簡單 CSV 解析（處理引號和逗號）
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          // 雙引號 = 單個引號
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  /**
   * CSV 文字 → 物件陣列
   */
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 1) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // 跳過空行
      const values = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] ? values[idx].trim() : '';
      });
      data.push(obj);
    }
    return data;
  }

  /**
   * 字串轉布林值
   */
  function parseBool(val) {
    if (!val) return false;
    return /是|yes|true|1|✓|checked/i.test(String(val));
  }

  /**
   * 解析標籤（逗號分隔）
   */
  function parseTags(tagStr) {
    if (!tagStr) return [];
    return tagStr.split(',').map(t => t.trim()).filter(t => t);
  }

  /**
   * 從 URL 抓 CSV
   */
  async function fetchCSV(url) {
    try {
      // 加快取破壞參數
      const urlWithCache = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      const response = await fetch(urlWithCache);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error('Failed to fetch:', url, error);
      return '';
    }
  }

  /**
   * 載入賽事資料
   * 預期欄位（調整成你 Sheets 中的實際欄位名）：
   *   名稱, 遊戲, 日期, 描述, 分類, 台灣選手, 線上直播, 賽程連結, 替代圖片, 狀態
   */
  async function loadEvents() {
    const csv = await fetchCSV(getSheetUrl(SHEET_GIDS.events));
    const raw = parseCSV(csv);

    return raw.map(row => ({
      名稱: row['名稱'] || row['事件名稱'] || '',
      遊戲: row['遊戲'] || row['遊戲名稱'] || '',
      日期: row['日期'] || row['時間'] || '',
      描述: row['描述'] || row['說明'] || '',
      分類: (row['分類'] || 'featured').toLowerCase(),
      台灣選手: parseBool(row['台灣選手']),
      線上直播: parseBool(row['線上直播']),
      賽程連結: row['賽程連結'] || row['連結'] || '',
      替代圖片: row['替代圖片'] || row['圖片'] || '',
      狀態: row['狀態'] || 'upcoming',
    })).filter(e => e.名稱); // 過濾掉空列
  }

  /**
   * 載入直播頻道資料
   * 預期欄位：
   *   頻道名稱, 平台, TwitchID, YouTubeID, 縮圖URL, 頭貼URL, 遊戲, 遊戲代碼, 觀看人數, 線上, 分類, 狀態
   */
  async function loadStreams() {
    const csv = await fetchCSV(getSheetUrl(SHEET_GIDS.streams));
    const raw = parseCSV(csv);

    return raw.map(row => ({
      頻道名稱: row['頻道名稱'] || row['頻道'] || '',
      平台: row['平台'] || 'Twitch',
      TwitchID: row['TwitchID'] || row['Twitch'] || '',
      YouTubeID: row['YouTubeID'] || row['YouTube'] || '',
      縮圖URL: row['縮圖URL'] || row['縮圖'] || '',
      頭貼URL: row['頭貼URL'] || row['頭貼'] || '',
      當前遊戲: row['遊戲'] || row['當前遊戲'] || '',
      gameKey: (row['遊戲代碼'] || row['遊戲'])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'other',
      觀看人數: parseInt(row['觀看人數'] || '0') || 0,
      線上: parseBool(row['線上'] || row['線上狀態']),
      分類: (row['分類'] || 'watchparty').toLowerCase(),
      狀態: row['狀態'] || 'online',
    })).filter(s => s.頻道名稱); // 過濾掉空列
  }

  /**
   * 載入 Banner 資料
   * 預期欄位：
   *   標題, 描述, 圖片URL, 連結, 分頁, 順序
   */
  async function loadBanners() {
    const csv = await fetchCSV(getSheetUrl(SHEET_GIDS.banners));
    const raw = parseCSV(csv);

    return raw.map(row => ({
      title: row['標題'] || '',
      desc: row['描述'] || '',
      img: row['圖片URL'] || row['圖片'] || '',
      link: row['連結'] || row['URL'] || '',
      page: (row['分頁'] || 'home').toLowerCase(),
      order: parseInt(row['順序'] || '0') || 0,
    }))
      .filter(b => b.title)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * 一次載入全部
   */
  async function loadAll() {
    console.log('Loading data from Google Sheets...');
    const [events, streams, banners] = await Promise.all([
      loadEvents(),
      loadStreams(),
      loadBanners(),
    ]);

    console.log('Loaded:', {
      events: events.length,
      streams: streams.length,
      banners: banners.length,
    });

    return {
      events,
      streams,
      banners,
    };
  }

  /**
   * 重新整理資料（定期更新）
   */
  let lastLoadTime = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取
  let cachedData = null;

  async function loadWithCache() {
    const now = Date.now();
    if (cachedData && now - lastLoadTime < CACHE_DURATION) {
      return cachedData;
    }
    cachedData = await loadAll();
    lastLoadTime = now;
    return cachedData;
  }

  return {
    loadEvents,
    loadStreams,
    loadBanners,
    loadAll,
    loadWithCache,
    SHEET_ID,
    SHEET_GIDS,
  };
})();

// ════════════════════════════════════════════
// 匯出使用方式：
// ════════════════════════════════════════════
/*
DataLoader.loadAll().then(data => {
  console.log('Events:', data.events);
  console.log('Streams:', data.streams);
  console.log('Banners:', data.banners);
  
  // 使用 data.events, data.streams, data.banners 更新頁面
});

// 或使用快取版本（建議用於定期刷新）
DataLoader.loadWithCache().then(data => {
  // ...
});
*/
