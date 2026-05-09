# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 開發鐵律（所有新增功能必須遵循）

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

啟動方式：`sessionManager.start(userId, originId, handler, context, client)`

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
dataStore.getAdmins() / dataStore.addAdmin(id) / dataStore.removeAdmin(id)

// 封鎖
dataStore.getBlockedUsers() / dataStore.blockUser(id, reason) / dataStore.unblockUser(id)

// 通用擴展（新增數據類型不用改 DataStore）
dataStore.set('key', value)
dataStore.get('key', defaultValue)

// 統一輸出
dataStore.exportFile('filename', content)
```

### 規則 3：命令必須透過 CommandRouter 登記

所有命令在 `src/modules/commands.js` 的 `registerAll()` 中登記：

```js
router.register('命令名', handler, {
    requireAuth: true,           // 是否需要管理員權限
    aliases: ['別名'],           // 可選別名
    isHash: false,               // 是否為 # 開頭的 hash 命令
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
# ✅ 正確：優雅重啟
pkill -f "node src/index"; sleep 2; node src/index.js

# 若瀏覽器殘留，只移除鎖定檔（不刪 session）：
rm -f .wwebjs_auth/session-pbots-client/SingletonLock
rm -f .wwebjs_auth/session-pbots-client/Default/SingletonLock
```

---

## 指令

```bash
npm start              # 啟動機器人 (node src/index.js)
npm run lint           # ESLint 檢查
npm run lint:fix       # ESLint 自動修復
npm run format         # Prettier 格式化
npm run format:check   # Prettier 檢查
npm test               # 執行測試 (node --test)
```

## 架構總覽

PBOTS 是基於 `whatsapp-web.js` + `LocalAuth` 的 WhatsApp 機器人。

### 目錄結構

```
src/
├── index.js                  # 主入口：初始化、訊息接收、生命週期管理
├── core/
│   ├── authManager.js        # 統一權限管理（→ DataStore）
│   ├── commandRouter.js      # 命令路由器：登記→解析→權限→分發
│   ├── sessionManager.js     # 通用互動會話管理器（群組/私訊分流）
│   └── dataStore.js          # 統一資料層（所有持久化數據的唯一入口）
├── modules/
│   └── commands.js           # 所有命令的登記與處理函數
tools/
├── common/
│   └── utils.js              # 共用工具函數（formatFileSize, ensureDir, calculateDirSize）
├── messageLogger.js          # JSONL 訊息日誌（append-only）
├── mediaDownloader.js        # 自動下載媒體檔案
├── imageToPdf.js             # 照片收集→PDF 生成（2×2 A4 網格）
├── cleanup.js                # 舊檔案清理／備份
├── healthMonitor.js          # 系統健康監控
├── errorRecovery.js          # 錯誤恢復與重連（指數退避）
├── weatherReporter.js        # 香港天文台天氣（axios）
├── newsReporter.js           # 地盤意外新聞
└── realNewsFetcher.js        # Google News RSS 抓取（cheerio 解析）
configs/
└── settings.json             # 靜態配置（前綴、功能開關、路徑）
data/
├── store/                    # 可變數據（admins.json, blocked.json, groups.json）
├── exports/                  # 統一輸出路徑
├── chats/                    # 訊息日誌 (JSONL)
├── images/                   # 媒體圖片
└── pdfs/                     # PDF 文件
```

### 訊息處理流程

1. `client.on('message')` → 建構 **`context`**：`{ userId, originId, isGroup, pushname, messageBody, groupName, groupId }`
2. 記錄訊息到 JSONL 日誌
3. **SessionManager 攔截**（優先級最高）：如果用戶有活躍會話 → 路由到會話 handler
4. **自動媒體下載**
5. **命令路由**：`CommandRouter.route()` → 解析 → 權限檢查 → 分發

### SessionManager

通用互動會話管理器。處理所有需要多步驟問答的工具。

- 同一用戶同時只能有一個活躍會話
- 群組觸發的命令 → 中間問答經私訊 → 結果發回群組
- 私訊觸發的命令 → 全部在私訊中完成
- 預設 5 分鐘超時，自動清理
- `#cancel` 通用取消任何活躍會話

### DataStore

統一資料層。主程式不直接讀寫檔案，所有持久化操作透過 DataStore。

- `getAdmins()` / `addAdmin()` / `removeAdmin()`
- `getBlockedUsers()` / `blockUser()` / `unblockUser()`
- `getAuthorizedGroups()` / `addAuthorizedGroup()` / `removeAuthorizedGroup()`
- `get(key, default)` / `set(key, value)` — 通用鍵值（擴展用）
- `exportFile(filename, content)` — 統一出檔

### AuthManager

統一權限管理，依賴 DataStore 進行持久化。

- `checkPermission(userId)` → `{ isAdmin, whitelistEnabled, hasFullAccess, isBlocked }`
- `isBlocked(userId)` — 封鎖檢查優先於所有權限
- `authenticateDirect(userId, password)` — 內聯認證
- `startPrivateSession()` / `handlePrivateReply()` — DM 認證流程
- 密碼優先從 `process.env.AUTH_PASSWORD` 讀取

### WhatsApp 特定細節

- 用戶 ID：`<電話號碼>@c.us`（私人）或 `<id>@g.us`（群組）
- `message.fromMe` 過濾自己的訊息
- `message.downloadMedia()` → `{ data: base64, mimetype }`
