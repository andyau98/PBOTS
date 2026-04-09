# tools/ - 輔助工具

此目錄包含機器人的輔助工具和工具模組，採用標準化接口設計。

## 工具模組說明

### 核心工具
- `messageLogger.js` - 訊息日誌系統
- `securityManager.js` - 安全管理器（白名單、權限控制）
- `mediaDownloader.js` - 媒體文件下載器
- `imageToPdf.js` - 圖片轉 PDF 工具
- `cleanup.js` - 系統清理管理器

### 標準化架構工具
- `contextStandardizer.js` - **標準化 Context 管理器**
  - 統一封裝身份識別和來源追蹤
  - 跨頻道交互狀態管理
  - 安全訊息發送機制

### 輔助工具
- `contextManager.js` - 上下文管理器（舊版本）

## 標準化接口特性

### 統一 Context 物件
所有工具模組使用統一的標準化 Context 物件：
- `userId` - 發言人的個人 ID
- `originId` - 訊息的來源 ID  
- `isGroup` - 是否為群組訊息
- `pushname` - 用戶顯示名稱

### 跨頻道通訊協定
- 全局 `activeInteractions` Map 管理狀態
- 自動回傳原點機制
- 安全發送保證

## 功能說明

- **標準化訊息處理工具**
- **文件操作工具**
- **系統監控工具**
- **跨頻道交互框架**