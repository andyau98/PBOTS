# 📁 src/ — PBOTS 核心原始碼

## 入口

`index.js` — 主入口：初始化所有服務、WhatsApp 客戶端、訊息路由、生命週期管理。

## 核心模組 (`core/`)

| 檔案                | 職責                                              |
| ------------------- | ------------------------------------------------- |
| `authManager.js`    | 統一權限管理（管理員、群組授權、白名單）          |
| `commandRouter.js`  | 命令路由器：登記 → 解析 → 權限檢查 → 分發         |
| `sessionManager.js` | 互動會話管理（群組私訊分流 + 群組鎖定）           |
| `dataStore.js`      | 統一資料層（唯一 JSON 讀寫入口）                  |
| `monitorServer.js`  | HTTP 監控儀表板 (localhost:3456) + SSE 日誌串流   |
| `logStream.js`      | Console 攔截 + 即時日誌推送                       |
| `scheduler.js`      | node-cron 排程（考勤 9:00 AM / 索引重建 3:00 AM） |

## 命令模組 (`modules/`)

`commands.js` — 所有命令在 `registerAll()` 中透過 CommandRouter 登記。

## 架構詳情

見根目錄 [CLAUDE.md](../CLAUDE.md)。
