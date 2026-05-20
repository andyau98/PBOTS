# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 開發鐵律（所有新增功能必須遵循）

### 規則 0：全部使用中文溝通

與用戶嘅所有溝通（包括回覆、thinking、程式註解、訊息字串）**必須**使用繁體中文。唔好用英文。

### 規則 1：互動命令必須使用 SessionManager

任何需要多步驟問答的工具（向用戶提問、收集資料、等待回覆），**必須**透過 `SessionManager` 實現，不得自行管理會話狀態。

- **群組觸發** → 中間問答經私訊進行 → 最終結果發回群組
- **私訊觸發** → 所有問答及結果在私訊中完成

Handler 標準介面：

```js
{
    name: '工具名稱',
    async start(ctx) → { question: "..." } | { done: true, result: "..." },
    async handleReply(ctx, message) → { question: "..." } | { done: true, result: "..." },
    async onTimeout(ctx) → "超時訊息",
    async onCancel(ctx) → "取消訊息",
}
```

啟動方式：`sessionManager.start(userId, originId, handler, context, client, timeout, senderId)`

- `senderId`：發送者嘅完整 WhatsApp ID（含 `@c.us` 或 `@lid` 後綴），用於正確格式嘅私訊發送。若省略則由 SessionManager 自動推斷

### 規則 2：所有可變數據必須透過 DataStore

**禁止**直接讀寫 JSON 檔案。所有持久化數據操作必須經過 `src/core/dataStore.js`：

```
configs/settings.json  →  靜態設定（前綴、功能開關、路徑）
.env                   →  敏感資訊（密碼）
data/store/*.json      →  可變數據（管理員、封鎖、群組…）
data/exports/          →  統一輸出路徑（報表、備份、PDF）
```

```js
const { dataStore } = require('./core/dataStore');

// 管理員
dataStore.getAdmins() / dataStore.addAdmin(id) / dataStore.removeAdmin(id);

// 封鎖
dataStore.getBlockedUsers() /
    dataStore.blockUser(id, reason) /
    dataStore.unblockUser(id);

// 通用擴展（新增數據類型不用改 DataStore）
dataStore.set('key', value);
dataStore.get('key', defaultValue);

// 統一輸出
dataStore.exportFile('filename', content);
```

### 規則 3：命令必須透過 CommandRouter 登記

所有命令在 `src/modules/commands.js` 的 `registerAll()` 中登記：

```js
router.register('命令名', handler, {
    requireAuth: true, // 是否需要管理員權限
    aliases: ['別名'], // 可選別名
    isHash: false, // 是否為 # 開頭的 hash 命令
});
```

Handler 簽名：`async (message, context, client, services) => void`

### 規則 4：訊息路由優先級（不可變更）

```
1. 群組鎖定檢查（Phase 7）
2. SessionManager 活躍會話攔截
3. 媒體自動下載
4. 命令路由 (CommandRouter)
```

### 規則 5：重啟時保留 WhatsApp Session

**不可** `rm -rf .wwebjs_auth/`。只殺 Node 進程，保留已登入的 session：

```bash
# ✅ 正確：優雅重啟（Windows）
taskkill //F //IM node.exe
taskkill //F //IM chrome.exe
# 只移除鎖定檔（不刪 session）：
rm -f .wwebjs_auth/session-pbots-client/SingletonLock
rm -f .wwebjs_auth/session-pbots-client/Default/SingletonLock
npm start

# 或使用 PBOTS.bat 一鍵重啟
```

---

## 指令

```bash
npm start              # 啟動機器人 (node src/index.js)
node src/index.js      # 直接啟動（同 npm start）
PBOTS.bat              # Windows 一鍵重啟（kill 舊進程 → 清鎖定檔 → 啟動）
npm run lint           # ESLint 檢查
npm run lint:fix       # ESLint 自動修復
npm run format         # Prettier 格式化
npm run format:check   # Prettier 檢查
npm test               # 執行測試 (node --test)
```

## 新電腦設定

```bash
git clone https://github.com/andyau98/Pbots.git
cd Pbots
git checkout master
npm install
cp .env.example .env
# 編輯 .env，設定 AUTH_PASSWORD=你的密碼
# 從舊電腦複製 .wwebjs_auth/ 目錄以保留 WhatsApp 登入（可選）
npm start
```

### Claude Code 跨電腦工作

此 repo 已包含 CLAUDE.md 和 `skills-lock.json`，Claude Code 會自動讀取：

- **CLAUDE.md** — 專案指引，在任何電腦上 Claude Code 都會自動載入
- **skills-lock.json** — 鎖定已安裝的 skills（integrate-whatsapp、pdf-generator），換電腦後 Claude Code 會自動還原
- **`.claude/` 目錄** — 已在 `.gitignore` 中排除。每台電腦需獨立設定（permissions、hooks 等），不需同步

### 換電腦後需手動調整

```bash
# 1. 修改 POR 圖紙路徑（每台電腦路徑不同）
# 編輯 configs/settings.json → paths.por

# 2. 若使用不同作業系統，檢查 Chrome 路徑
# Windows 預設：C:/Program Files/Google/Chrome/Application/chrome.exe
# macOS 需改為：/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# 3. 若沒有舊 WhatsApp session，掃 QR Code 重新登入即可
```

## 架構總覽

PBOTS 是基於 `whatsapp-web.js` + `LocalAuth` 的 WhatsApp 機器人，用於幕牆工地管理。

### 目錄結構

```
src/
├── index.js                  # 主入口：初始化、訊息接收、生命週期管理
├── core/
│   ├── authManager.js        # 統一權限管理（→ DataStore）
│   ├── commandRouter.js      # 命令路由器：登記→解析→權限→分發
│   ├── sessionManager.js     # 通用互動會話管理器（群組/私訊分流 + 群組鎖定）
│   ├── dataStore.js          # 統一資料層（所有持久化數據的唯一入口）
│   ├── monitorServer.js      # HTTP 監控儀表板（localhost:3456，6卡詳細數據 + 日誌過濾 + SSE 狀態）
│   ├── logStream.js          # SSE 即時日誌串流
│   └── scheduler.js          # node-cron 排程（9:00 AM 考勤 + 3:00 AM 圖紙索引重建）
├── modules/
│   └── commands.js           # 所有命令的登記與處理函數
skills/
├── workerAttendance.js       # 🕐 工人考勤模組
├── drawingSearch.js          # 🔍 物料圖紙搜尋（預建索引 + 模糊匹配）
└── README.md                 # 技能規劃
tools/
├── common/utils.js           # 共用工具函數
├── messageLogger.js          # JSONL 訊息日誌
├── mediaDownloader.js        # 自動下載媒體
├── imageToPdf.js             # 照片→PDF（pdfkit, simhei.ttf）
├── cleanup.js                # 舊檔案清理
├── healthMonitor.js          # 系統健康監控
├── errorRecovery.js          # 錯誤恢復（指數退避）
├── weatherReporter.js        # 香港天文台天氣（axios）
├── newsReporter.js           # 地盤意外新聞（cheerio）
└── realNewsFetcher.js        # Google News RSS
configs/
└── settings.json             # 靜態配置
data/
├── store/                    # admins.json, blocked.json, groups.json, foremen.json, drawing_index.json
├── exports/                  # 統一輸出路徑
├── chats/                    # 訊息日誌 (JSONL)
├── images/                   # 媒體圖片
└── pdfs/                     # PDF 文件
Sample/LabourSummary/
└── HGRH開工人數表.xlsx        # 考勤 Excel 範本
```

### 服務容器 (Services Container)

`index.js` 初始化所有模組後，將其注入單一 `services` 物件，傳遞給每個命令處理器。可用的服務鍵名：

```
config, authManager, sessionManager, dataStore, monitorServer,
messageLogger, mediaDownloader, imageToPdf, cleanupManager,
healthMonitor, errorRecovery, weatherReporter, newsReporter
```

新增模組的 handler 可以透過解構取得所需服務：`async (msg, ctx, client, { serviceName }) => {}`

### 排程任務

| 時間    | 頻率     | 任務                                     |
| ------- | -------- | ---------------------------------------- |
| 9:00 AM | 週一至六 | 考勤申報（向已登記判頭發送私訊收集人數） |
| 3:00 AM | 每日     | 重建圖紙索引（掃描 `paths.por` 目錄）    |

時區固定為 `Asia/Hong_Kong`。

### 圖紙搜尋 (Drawing Search)

`skills/drawingSearch.js` 使用**預建索引策略**：啟動時掃描 `config.paths.por` 目錄建立 `data/store/drawing_index.json`，後續查詢只讀索引不掃描檔案系統。索引支援物料碼前綴分類（FST=鐵料、FAC=鋁板、BGL=玻璃 等 10 類），並提供模糊匹配。凌晨 3:00 自動重建，管理員可手動 `#searchpor`。

### 考勤模組 (Worker Attendance)

`skills/workerAttendance.js` 管理判頭登記與每日工人人數申報。核心流程：

- **登記判頭** (`#登記判頭`)：互動式選擇 Excel 欄位（公司名），自動綁定 WhatsApp ID
- **申報人數** (`#申報`)：判頭輸入人數 → 確認 → 寫入 Excel。**若今日已申報，會顯示原有數字並支援修改**
- **自動申報**：每日 9:00 AM（週一至六）向所有已登記判頭發送私訊請求
- **查詢** (`#今日人數`)：顯示今日各公司已申報人數及總數
- Excel 操作使用 `exceljs` 保留原有格式、樣式、合併儲存格

### DataStore 內部方法

`foremen.json` 目前透過 `dataStore._read()` / `dataStore._write()` 內部方法操作（`workerAttendance.js` 和 `scheduler.js`），而非公共 API。DataStore 的泛型 `get(key)` / `set(key, value)` 使用 `data/store/app.json` 作為後端。

### 錯誤恢復

`tools/errorRecovery.js` 實現指數退避重連：基數 1 秒、上限 30 秒、最多 10 次。錯誤分類為：認證、連接、網絡、權限、檔案、媒體、記憶體、未知。心跳監控每 60 秒更新一次。

### 完整命令列表

| 命令                                                                                         | 類別 | 權限 | 功能                                             |
| -------------------------------------------------------------------------------------------- | ---- | ---- | ------------------------------------------------ |
| `!ping`                                                                                      | 基礎 | 公開 | 測試響應                                         |
| `!help`                                                                                      | 基礎 | 公開 | 幫助訊息                                         |
| `!status`                                                                                    | 基礎 | 公開 | 機器人狀態                                       |
| `!stats`                                                                                     | 基礎 | 公開 | 今日統計                                         |
| `!weather` / `!天氣`                                                                         | 資訊 | 公開 | 香港天氣                                         |
| `!news` / `!新聞` / `!地盤` / `!construction` / `!monitor` / `!監控` / `!accident` / `!意外` | 資訊 | 公開 | 地盤新聞                                         |
| `!whitelist <密碼>`                                                                          | 認證 | 公開 | 內聯認證                                         |
| `!whitelist`                                                                                 | 認證 | 公開 | DM 認證流程                                      |
| `#TOPDF [標題]`                                                                              | PDF  | 管理 | 照片收集→PDF                                     |
| `#done`                                                                                      | PDF  | 管理 | 完成 PDF                                         |
| `#cancel`                                                                                    | 通用 | 管理 | 取消當前會話                                     |
| `#申報`                                                                                      | 考勤 | 管理 | 申報今日人數（支援修改：重複觸發會顯示原有數字） |
| `#今日人數`                                                                                  | 考勤 | 管理 | 查詢今日申報                                     |
| `#登記判頭`                                                                                  | 考勤 | 管理 | 互動登記判頭                                     |
| `#判頭列表`                                                                                  | 考勤 | 管理 | 列出判頭                                         |
| `#移除判頭 [ID]`                                                                             | 考勤 | 管理 | 移除判頭                                         |
| `!security`                                                                                  | 管理 | 管理 | 安全狀態                                         |
| `!cleanup`                                                                                   | 管理 | 管理 | 系統清理                                         |
| `!mediastats`                                                                                | 管理 | 管理 | 媒體統計                                         |
| `!addgroup`                                                                                  | 管理 | 管理 | 授權群組                                         |
| `!removegroup [ID]`                                                                          | 管理 | 管理 | 移除授權                                         |
| `!cleanupwhitelist`                                                                          | 管理 | 管理 | 重置所有白名單數據                               |
| `#圖紙 [編號]`                                                                               | 圖紙 | 管理 | 搜尋圖紙 (POR)                                   |
| `#searchpor`                                                                                 | 圖紙 | 管理 | 手動重建圖紙索引                                 |

### WhatsApp 特定細節

- 用戶 ID：`<電話號碼>@c.us`（私人）或 `<id>@g.us`（群組）或 `<id>@lid`（LID 格式）
- SessionManager 在發送 DM 時會根據 originId 後綴自動推斷目標 ID 格式（`@c.us` vs `@lid`），見 `src/core/sessionManager.js` 嘅 `_sendDM()` 方法
- `message.fromMe` 過濾自己的訊息
- `message.downloadMedia()` → `{ data: base64, mimetype }`
- 系統 Chrome 路徑（Windows）：`C:/Program Files/Google/Chrome/Application/chrome.exe`（見 `src/index.js` puppeteer 設定）
- 中文字體（Windows）：`C:/Windows/Fonts/simhei.ttf`（pdfkit 用）

### 關鍵配置路徑

- `paths.por` — 物料圖紙目錄，`#圖紙` 命令的強依賴。若未設定或路徑不存在，圖紙搜尋會提示錯誤
- `features.reply_in_group` — 控制群組中非 whitelist 命令是否回覆
- `security.whitelist_enabled` — 白名單模式開關
- `security.auth_password` — 靜態密碼備用（當 `.env` 未設定時使用，但 `authManager` 會警告示例密碼 `123456` 不安全）
