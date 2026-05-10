# PBOTS 幕牆工地 WhatsApp 機器人 — 完整項目總覽

> 最後更新：2026-05-10
> GitHub：https://github.com/andyau98/Pbots
> 開發環境：MacBook Air + Node.js v24.13.1

---

## 目錄

1. [專案背景](#1-專案背景)
2. [架構總覽](#2-架構總覽)
3. [開發鐵律](#3-開發鐵律)
4. [完整命令列表](#4-完整命令列表)
5. [已實作模組](#5-已實作模組)
6. [技術棧](#6-技術棧)
7. [新電腦設定](#7-新電腦設定)
8. [待開發模組](#8-待開發模組)
9. [物料圖紙搜尋模組 — 設計方案](#9-物料圖紙搜尋模組--設計方案)

---

## 1. 專案背景

PBOTS 是基於 `whatsapp-web.js` + `LocalAuth` 的 WhatsApp 機器人，專門用於**幕牆（Curtain Wall）工地管理**。

### 核心場景

- **工人考勤**：每日 9:00 AM 自動向判頭收集工人人數，填入 HGRH Excel 表
- **照片收集→PDF**：工地巡查拍照，收集後自動生成 A4 PDF 報告
- **權限管理**：白名單 + 群組授權，管理員控制工具存取
- **資訊查詢**：香港天氣、地盤意外新聞

### 用戶角色

- **管理員**：擁有全部命令權限，可登記判頭、授權群組
- **判頭（Foreman）**：每日申報工人人數，一家公司一位
- **管工（Supervisor）**：日常巡查使用 PDF 收集等功能

---

## 2. 架構總覽

### 目錄結構

```
PBots/
├── src/
│   ├── index.js                  # 主入口：初始化、訊息路由、生命週期
│   ├── core/
│   │   ├── authManager.js        # 統一權限管理（→ DataStore）
│   │   ├── commandRouter.js      # 命令路由器：登記→解析→權限→分發
│   │   ├── sessionManager.js     # 互動會話（群組/私訊分流 + 群組鎖定）
│   │   ├── dataStore.js          # 統一資料層（唯一持久化入口）
│   │   ├── monitorServer.js      # HTTP 儀表板 localhost:3456 + SSE 日誌
│   │   ├── logStream.js          # 攔截 console → SSE 推送
│   │   └── scheduler.js          # node-cron 排程
│   └── modules/
│       └── commands.js           # 所有命令的登記與處理函數
│
├── skills/
│   ├── workerAttendance.js       # 🕐 工人考勤模組
│   ├── drawingSearch.js          # 📦 物料圖紙搜尋（計劃中）
│   └── README.md                 # 技能規劃文件
│
├── tools/
│   ├── common/utils.js           # 共用工具函數
│   ├── messageLogger.js          # JSONL 訊息日誌（append-only）
│   ├── mediaDownloader.js        # 自動下載媒體
│   ├── imageToPdf.js             # 照片→PDF（pdfkit + Arial Unicode.ttf）
│   ├── cleanup.js                # 舊檔案清理
│   ├── healthMonitor.js          # 系統健康監控
│   ├── errorRecovery.js          # 錯誤恢復（指數退避）
│   ├── weatherReporter.js        # 香港天氣（axios + 天文台 API）
│   ├── newsReporter.js           # 地盤新聞（cheerio + Google News RSS）
│   └── realNewsFetcher.js        # RSS 解析器
│
├── configs/
│   └── settings.json             # 靜態配置（前綴、路徑、功能開關）
│
├── data/
│   ├── store/                    # 可變數據（JSON）
│   │   ├── admins.json           # 管理員列表
│   │   ├── blocked.json          # 封鎖用戶
│   │   ├── groups.json           # 授權群組
│   │   └── foremen.json          # 判頭配置
│   ├── exports/                  # 統一輸出路徑
│   ├── chats/                    # 訊息日誌 (JSONL)
│   ├── images/                   # 媒體圖片
│   └── pdfs/                     # PDF 文件
│
├── Sample/LabourSummary/
│   └── HGRH開工人數表.xlsx        # 考勤 Excel 範本（exceljs 讀寫）
│
├── CLAUDE.md                     # Claude Code 開發指引
├── .env.example                  # 環境變數範例
└── package.json
```

### 訊息路由優先級

```
1. 群組鎖定檢查（Phase 7）     ← 防止他人干擾進行中的會話
2. SessionManager 活躍會話攔截  ← 多步驟問答路由
3. 媒體自動下載                 ← 保存圖片/文件
4. 命令路由 (CommandRouter)     ← 單步命令處理
```

### 互動會話規則（SessionManager）

```
用戶觸發命令
    ├─ 群組 (@g.us)
    │     ├─ 所有中間問答 → 私訊給用戶
    │     ├─ 每步確認「✅ 收到: {答案}」
    │     ├─ 群組鎖定（其他人無法干擾）
    │     └─ 最終結果 → 發回群組
    │
    └─ 私訊 (@c.us / @lid)
          └─ 全部問答及結果 → 在私訊中完成
```

### 數據職責分離

```
configs/settings.json     →  靜態設定（前綴、路徑、功能開關）
.env                      →  敏感資訊（密碼 AUTH_PASSWORD）
data/store/*.json         →  可變數據（管理員、封鎖、群組、判頭…）
data/exports/             →  輸出的報表、備份、PDF
```

---

## 3. 開發鐵律

### 規則 1：互動命令必須使用 SessionManager

任何需要多步驟問答的工具，**必須**透過 `sessionManager.start()` 實現。

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

### 規則 2：所有可變數據必須透過 DataStore

**禁止**直接讀寫 JSON 檔案。使用 `dataStore.get(key)` / `dataStore.set(key, value)`。

### 規則 3：命令必須透過 CommandRouter 登記

所有命令在 `src/modules/commands.js` 的 `registerAll()` 中登記。

### 規則 4：訊息路由優先級不可變更

### 規則 5：重啟時保留 WhatsApp Session

```bash
# ✅ 正確
pkill -f "node src/index"; sleep 2; node src/index.js

# ❌ 錯誤 — 會破壞已登入的 session
rm -rf .wwebjs_auth/
```

---

## 4. 完整命令列表

| 命令 | 類別 | 權限 | 功能 |
|------|------|------|------|
| `!ping` | 基礎 | 公開 | 測試響應 |
| `!help` | 基礎 | 公開 | 幫助訊息 |
| `!status` | 基礎 | 公開 | 機器人狀態 |
| `!stats` | 基礎 | 公開 | 今日統計 |
| `!weather` / `!天氣` | 資訊 | 公開 | 香港天氣 |
| `!news` / `!新聞` / `!地盤` | 資訊 | 公開 | 地盤新聞 |
| `!whitelist <密碼>` | 認證 | 公開 | 內聯認證（直接輸入密碼） |
| `!whitelist` | 認證 | 公開 | DM 私信認證流程 |
| `#TOPDF [標題]` | PDF | 管理 | 照片收集→PDF（2×2 A4 網格） |
| `#done` | PDF | 管理 | 完成 PDF 生成 |
| `#cancel` | 通用 | 公開 | 取消當前會話 |
| `#申報` | 考勤 | 管理 | 申報今日工人人數（SessionManager 私訊流程） |
| `#今日人數` | 考勤 | 管理 | 查詢今日已申報數據 |
| `#登記判頭` | 考勤 | 管理 | 互動登記判頭（自動擷取 WhatsApp ID，從 Excel 選公司） |
| `#判頭列表` | 考勤 | 管理 | 列出所有已登記判頭 |
| `#移除判頭 [ID]` | 考勤 | 管理 | 移除判頭 |
| `!security` | 管理 | 管理 | 安全狀態報告 |
| `!cleanup` | 管理 | 管理 | 系統清理 |
| `!mediastats` | 管理 | 管理 | 媒體統計 |
| `!addgroup` | 管理 | 管理 | 授權當前群組（全群獲得權限） |
| `!removegroup [ID]` | 管理 | 管理 | 移除群組授權 |
| `#圖紙 [編號]` | 物料 | 管理 | 搜尋加工圖（計劃中） |
| `#重建索引` | 物料 | 管理 | 重建圖紙索引（計劃中） |

---

## 5. 已實作模組

### 5.1 工人考勤（workerAttendance.js）

**排程**：每日 9:00 AM（週一至六）自動觸發，所有已登記判頭收到私訊。

**流程**：
```
9:00 AM → Bot 私訊判頭：「請輸入今日 {公司} 工人總數」
判頭回覆：「23」
Bot：「✅ 收到: 23 人。確認？回覆 y 寫入 Excel」
判頭回覆：「y」
Bot：寫入 HGRH開工人數表.xlsx → 完成
```

**Excel 寫入**：使用 `exceljs` 保留原有格式、合併儲存格、樣式。固定行計算（`row = 標題行 + 日期`）。

**去重規則**：同一 WhatsApp ID 只能登記一家公司，再次登記自動取代舊記錄。

### 5.2 PDF 收集（imageToPdf.js）

**流程**：`#TOPDF 安全巡查報告` → 私訊收集照片 → `#done` → 生成 A4 2×2 網格 PDF → 發送到群組。

**字體**：`/Library/Fonts/Arial Unicode.ttf`（.ttf 優先於 .ttc，pdfkit 完全支援）。

### 5.3 天氣 + 新聞（weatherReporter.js, newsReporter.js）

香港天文台 API + Google News RSS（cheerio 解析）。

### 5.4 監控儀表板（monitorServer.js）

`http://localhost:3456` — 登入前顯示 QR Code，登入後切換為即時監控（訊息統計、活躍會話、terminal 日誌 SSE 串流）。

---

## 6. 技術棧

| 類別 | 技術 | 用途 |
|------|------|------|
| 核心 | whatsapp-web.js v1.34.7 | WhatsApp Web 自動化（puppeteer + 系統 Chrome） |
| PDF | pdfkit | A4 PDF 生成 |
| Excel | exceljs | 讀寫 .xlsx 並保留格式 |
| 排程 | node-cron | 每日 9:00 AM + 凌晨 3:00 AM |
| HTTP | axios | 天氣 API、RSS 請求 |
| 解析 | cheerio | HTML/XML 解析 |
| 環境 | dotenv | 密碼管理 |
| 日誌 | 自訂 JSONL | append-only 每日訊息日誌 |

**系統依賴**：
- macOS Chrome：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- 中文字體：`/Library/Fonts/Arial Unicode.ttf`

---

## 7. 新電腦設定

```bash
# 1. 克隆專案
git clone https://github.com/andyau98/Pbots.git
cd Pbots

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env：AUTH_PASSWORD=你的密碼

# 4. （可選）從舊電腦複製 WhatsApp session
# scp -r old-pc:.wwebjs_auth/ .

# 5. 啟動
npm start
# 監控儀表板：http://localhost:3456
```

---

## 8. 待開發模組

| 模組 | 命令 | 功能 | 狀態 |
|------|------|------|------|
| 📦 物料圖紙搜尋 | `#圖紙 [編號]` | 模糊搜尋加工圖 PDF | 設計中 |
| 🔍 瑕疵驗收 | `#瑕疵 [描述]` | 拍照記錄瑕疵、指派責任方、跟進修復 | 規劃中 |
| 🛡️ 安全紀錄 | `#安全巡查` `#工具箱` | 安全巡查、事件上報 | 規劃中 |
| 📊 報表生成 | `#日報` `#週報` | 自動匯總數據生成 PDF | 規劃中 |
| ⚡ 天氣警報 | — | 8號風球/黑雨自動通知全群 | 規劃中 |

---

## 9. 物料圖紙搜尋模組 — 設計方案

### 背景

POR 資料夾結構：`POR/{POR名稱}/` 內含 50,000+ 個加工圖 PDF/DWG 檔案。

命名格式：`{系統碼}-{流水號}.pdf`（如 `ACB-421234.pdf`），位置圖含 `_TG` 後綴。

系統碼（23個）：WWA, WWB, WCA, WCB, ACA, ACB, ACC, ACD, BTA, BTB, BTC, BTE, AFA, AFB, LVA, LVB, LVD, CPA, CPB, GWA, GWB, CWB

物料碼（10個）：FST(鐵料), FAC(鋁板), BOM(雜件), BBF(螺絲), FFA(防水片), BGK(墊塊), FHU(組裝件), BGL(玻璃), FHA(鋁料加工), FSS(不鏽鋼)

### 核心設計：預建索引 + 定時更新

```
┌──────────────────────────────────────────┐
│  索引檔案（唯一搜尋來源）                    │
│  data/store/drawing_index.json            │
│  [{name, path, system, por, hasTag}, ...] │
│  5 萬筆，約 3-5 MB，常駐記憶體              │
└──────────────────────────────────────────┘
        ▲                          │
        │ 定時重建（凌晨 3:00）      │ 即時查詢（<10ms）
        │                          ▼
   POR 資料夾               WhatsApp Bot 搜尋
   （5 萬檔案）              substring match
```

**Bot 永遠不掃描檔案系統**。找到匹配 → 用 `MessageMedia.fromFilePath(路徑)` 直接發送。

### 搜尋流程

```
管工: #圖紙 1234
  → 載入 drawing_index.json（常駐記憶體）
  → 子字串匹配所有 name（5萬筆 <10ms）
  → >25 結果？→ 問物料類型篩選（FST/FAC/BOM...）
  → 顯示清單（最多 10 個）
  → 管工選數字 → 發送 PDF
  → "需要位置圖（TG）？(y/n)"
      → y → 發送 _TG.pdf
      → n → 完成
```

### 索引更新策略

| 觸發 | 說明 |
|------|------|
| 定時 | 每日凌晨 3:00 AM（scheduler.js） |
| 手動 | `#重建索引` 命令（管理員） |
| 首次 | 索引檔不存在時自動建立 |

### 命令

| 命令 | 功能 |
|------|------|
| `#圖紙 [編號]` | 模糊搜尋加工圖（互動流程） |
| `#重建索引` | 手動重建索引（管理員） |

### 配置

`configs/settings.json` → `paths.por: "/path/to/POR/folder"`

### 效能

| 操作 | 耗時 |
|------|------|
| 首次索引建立 | 2-5 秒（一次性） |
| 搜尋（5萬筆 substring） | <10ms |
| 載入索引檔 | ~50ms（啟動時） |
| 發送 PDF（100KB） | ~1 秒 |

### 檔案變更

| 檔案 | 操作 |
|------|------|
| `skills/drawingSearch.js` | **新建** — 索引 + 搜尋 + SessionManager handler |
| `src/modules/commands.js` | **修改** — 登記 #圖紙 #重建索引 |
| `src/core/scheduler.js` | **修改** — 加入凌晨 3:00 重建索引 |
| `configs/settings.json` | **修改** — 新增 paths.por |
| `data/store/drawing_index.json` | **新建** — 索引快取（首次自動生成） |
