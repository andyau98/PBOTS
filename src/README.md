# src/ - 核心源代碼

此目錄包含 WhatsApp 機器人的核心源代碼文件，採用標準化訊息處理架構。

## 文件說明

- `index.js` - 主入口文件（部分重構版本）
- `index_refactored.js` - **重構後的主入口文件**，採用標準化 Context 架構

## 標準化架構特性

### 訊息預處理器 (Standard Middleware Logic)
- **標準化 Context 物件**：統一封裝身份識別和來源追蹤
- **身份識別標準化**：`userId`、`originId`、`isGroup`、`pushname`
- **一致性保證**：所有 Tools 使用統一的 Context 物件

### 跨頻道通訊協定
- **群組-私訊-群組完整流程**：標準化交互流程
- **自動回傳原點機制**：記錄 `originId` 實現回傳群組
- **安全發送保證**：防止私密資訊誤發到群組

### 安全性標準化
- **權限隔離**：白名單只認人，不認群組
- **身份混淆解決**：`message.from` 與 `message.author` 不再混淆
- **防錯處理**：完善的參數驗證和錯誤處理

## 功能特性

- QR Code 掃描登入
- 持久化會話管理
- 標準化命令處理 (!ping, !whitelist, !help, !security, #topdf, !cleanup)
- 完整的日誌系統
- **標準化跨頻道交互框架**