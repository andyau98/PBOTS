# 🎯 skills/ - 建築工程技能模組

此目錄包含 PBOTS 的工地業務技能模組。每個技能遵循 SessionManager 互動框架，透過 CommandRouter 登記。

## 🏗️ 已實作底層架構

所有技能共享以下核心機制：

- **SessionManager** (`src/core/sessionManager.js`)：群組觸發 → 私訊問答 → 群組結果，附群組鎖定防干擾
- **CommandRouter** (`src/core/commandRouter.js`)：統一命令登記與權限分發
- **DataStore** (`src/core/dataStore.js`)：所有可變數據的統一持久化入口
- **AuthManager** (`src/core/authManager.js`)：管理員 / 封鎖 / 授權群組權限

### 技能 Handler 標準介面

```js
{
    name: '技能名稱',
    async start(ctx) → { question: "..." } | { done: true, result: "..." },
    async handleReply(ctx, message) → { question: "..." } | { done: true, result: "..." },
    async onTimeout(ctx) → "超時訊息",
    async onCancel(ctx) → "取消訊息",
}
```

### 登記方式

在 `src/modules/commands.js` 的 `registerAll()` 中：

```js
router.register('命令名', handlerFunction, {
    requireAuth: true,
    aliases: ['別名'],
    isHash: false,
});
```

---

## 📋 技能列表

### 🕐 工人考勤 (WorkerAttendance) ✅ 已實作

- **命令**: `#申報` / `#今日人數` / `#登記判頭` / `#判頭列表` / `#移除判頭`
- **功能**: 每日 9:00 AM 自動向判頭收集人數，寫入 Excel 範本，支援修改
- **數據**: `data/store/foremen.json`
- **檔案**: `skills/workerAttendance.js`

### 🔍 物料圖紙搜尋 (Drawing Search) ✅ 已實作

- **命令**: `#圖紙 [編號]` / `#重建索引`
- **功能**: 預建索引搜尋 POR 目錄，支援物料碼分類（FST=鐵料、FAC=鋁板…），凌晨 3:00 AM 自動重建
- **數據**: `data/store/drawing_index.json`
- **檔案**: `skills/drawingSearch.js`

### 📦 物料追蹤 (MaterialTracking)

- **命令**: `#登記物料 [UnitID]` / `#物料狀態 [UnitID]` / `#物料報表`
- **功能**: 幕牆單元從生產→運送→安裝→驗收的完整狀態追蹤
- **數據**: units.json, unit_status_log.json
- **狀態**: 待實作

### 🔍 瑕疵驗收 (SnagList)

- **命令**: `#瑕疵 [描述]` / `#指派 [ID] [公司]` / `#修復完成 [ID]` / `#瑕疵報表`
- **功能**: 拍照記錄瑕疵、分配責任方、跟進修復狀態、生成報表
- **數據**: snags.json
- **狀態**: 待實作

### 🛡️ 安全紀錄 (SafetyRecord)

- **命令**: `#安全巡查 [區域]` / `#事件上報` / `#工具箱`
- **功能**: 每日安全巡查紀錄、危險事件上報、工具箱會議記錄
- **數據**: safety_reports.json
- **狀態**: 待實作

### 📊 報表生成 (ReportGeneration)

- **命令**: `#日報` / `#週報`
- **功能**: 自動匯總當日/當週所有數據生成 PDF 報表
- **輸出**: data/exports/
- **狀態**: 待實作

---

## 🔧 技能執行流程

### 標準流程（SessionManager 強制執行）

```
1. 觸發階段：用戶在群組（或私訊）發送命令
2. 私訊階段：機器人透過 SessionManager 在私訊中收集資訊
   每步皆有「✅ 收到: {答案}」確認回饋
3. 處理階段：收集完成後處理數據，產生結果
4. 發布階段：群組觸發 → 結果發回群組；私訊觸發 → 結果發回私訊
```

### 群組鎖定機制

```
師傅 A 在群組發起 #瑕疵
  → 群組鎖定給師傅 A，其他人亂入被忽略
  → 所有問答經私訊進行
  → 完成後結果發回群組，解鎖
```

---

## 🚀 開發指南

### 建立新技能

1. 在 `skills/` 目錄下建立 `skillName.js`
2. 實作 SessionManager handler 介面（start / handleReply / onTimeout / onCancel）
3. 使用 DataStore 進行數據持久化（`dataStore.get(key)` / `dataStore.set(key, value)`）
4. 在 `src/modules/commands.js` 的 `registerAll()` 中登記命令
5. 如需 PDF 輸出，使用 `dataStore.exportFile(filename, content)` 統一出檔

### 數據規範

- 所有可變數據透過 `src/core/dataStore.js` 操作
- 專用數據可建立獨立 JSON 檔案（如 `data/store/snags.json`）
- 報表/備份輸出到 `data/exports/`
- 媒體檔案存放於 `data/images/`

### 已安裝外部 Skills（Claude Code 輔助）

- `gokapso/agent-skills@integrate-whatsapp` — WhatsApp API 參考（注意：非 whatsapp-web.js）
- `jwynia/agent-skills@pdf-generator` — PDF 生成技術參考
