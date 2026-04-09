# 🤖 EngineeringBot - WhatsApp 工程機器人

**版本**: v2.0.0-Standardized  
**狀態**: ✅ **標準化架構完成 - 專業級系統就緒**  
**最後更新**: 2026年4月9日  

## 🚀 專案概述

EngineeringBot 是一個功能完整的 WhatsApp 機器人，採用標準化訊息處理架構與跨頻道通訊協定。專案經過系統性全域重構，具備專業級的開發基礎。

## ✅ 核心特性

### 🏗️ 標準化架構
- **訊息預處理器**：統一封裝身份識別和來源追蹤
- **跨頻道通訊協定**：完整的群組-私訊-群組交互流程
- **安全性標準化**：統一的白名單驗證機制

### 🔧 功能模組
- **QR Code 掃描登入**：支持持久化會話管理
- **標準化命令處理**：!ping, !whitelist, !help, !security, #topdf, !cleanup
- **媒體文件處理**：自動下載、圖片轉 PDF
- **系統監控**：健康檢查、自動清理

### 🛡️ 安全性
- **權限隔離**：白名單只認人，不認群組
- **身份混淆解決**：`message.from` 與 `message.author` 不再混淆
- **安全發送保證**：防止私密資訊誤發到群組

## 📁 專案結構

```
PBOTS/
├── src/                    # 核心源代碼
│   ├── index.js           # 主入口文件（部分重構）
│   └── index_refactored.js # 重構後的主入口文件
├── tools/                  # 輔助工具模組
│   ├── messageLogger.js   # 訊息日誌系統
│   ├── securityManager.js # 安全管理器
│   ├── contextStandardizer.js # 標準化 Context 管理器
│   ├── mediaDownloader.js # 媒體文件下載器
│   ├── imageToPdf.js      # 圖片轉 PDF 工具
│   └── cleanup.js         # 系統清理管理器
├── configs/                # 配置檔案
│   └── settings.json      # 主要配置檔案
├── data/                  # 數據存儲
│   ├── chats/            # 聊天記錄
│   ├── images/           # 圖片文件
│   └── pdfs/             # PDF 文件
├── logs/                  # 日誌文件
├── backups/               # 備份文件
├── skills/                # 技能模組
├── envelope/              # 信封文件
└── MarkDown/              # 進度報告
    ├── PHASE1_PROGRESS_REPORT.md
    ├── PHASE2_PROGRESS_REPORT.md
    ├── PHASE3_PROGRESS_REPORT.md
    ├── PHASE4_PROGRESS_REPORT.md
    ├── PHASE5_PROGRESS_REPORT.md
    └── PHASE6_STANDARDIZATION_REPORT.md
```

## 🎯 標準化架構

### Context 物件結構
```javascript
const context = {
  // 身份識別
  userId: "1234567890@c.us",        // 發言人的個人 ID
  originId: "120363424519179359@g.us", // 訊息的來源 ID
  isGroup: true,                    // 是否為群組訊息
  pushname: "阿A",                   // 用戶顯示名稱
  
  // 訊息內容
  messageBody: "!whitelist",
  message: messageObject,           // 原始訊息物件
  
  // 群組資訊
  groupName: "My private test",
  groupId: "120363424519179359@g.us"
}
```

### 跨頻道交互流程

#### 群組觸發完整流程
```
[群組輸入 !whitelist] 
→ [標準化 Context 封裝] 
→ [記錄跨頻道交互] 
→ [群組回覆：請檢查私訊] 
→ [安全發送私訊] 
→ [用戶私訊回覆 288365] 
→ [驗證成功] 
→ [私訊回覆：✅ 認證成功。] 
→ [自動回群組：✅ @用戶 認證成功，已獲取管理員權限。]
```

#### 私訊直接流程
```
[私訊輸入 !whitelist] 
→ [標準化 Context 封裝] 
→ [私訊回覆：請輸入管理員密碼] 
→ [用戶回覆 288365] 
→ [驗證成功] 
→ [私訊回覆：✅ 認證成功。]
```

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置設定
編輯 `configs/settings.json` 文件，配置機器人參數。

### 3. 啟動機器人
```bash
# 使用重構後的標準化版本
node src/index_refactored.js

# 或使用原始版本
node src/index.js
```

### 4. 掃描 QR Code
在終端機掃描顯示的 QR Code 登入 WhatsApp。

## 📋 可用命令

### 基礎命令
- `!ping` - 測試機器人是否在線
- `!help` - 顯示幫助訊息
- `!security` - 查看安全狀態

### 管理命令
- `!whitelist` - 申請管理員權限（需要密碼驗證）
- `!cleanup` - 執行系統清理

### 工具命令
- `#topdf` - 將最近圖片轉換為 PDF

## 🔧 開發指南

### 添加新命令
所有新命令應使用標準化 Context 物件：

```javascript
async function handleNewCommand(context) {
    const command = context.messageBody.split(' ')[0].toLowerCase().trim();
    
    // 使用標準化 Context 物件
    console.log(`處理命令: ${command} 來自 ${context.pushname}`);
    
    // 安全發送訊息
    await contextStandardizer.safeSendMessage(
        client, 
        context.userId, 
        "回應訊息", 
        context
    );
}
```

### 跨頻道交互
如需實現跨頻道交互，使用 `contextStandardizer`：

```javascript
// 記錄交互
contextStandardizer.recordInteraction(context, command);

// 獲取交互記錄
const interaction = contextStandardizer.getActiveInteraction(context.userId);

// 完成交互
contextStandardizer.completeInteraction(context.userId);
```

## 📊 備份管理

專案包含 Git 備份管理工具：

```bash
# 執行備份
./backup -save

# 查看備份紀錄
./backup -list

# 恢復備份
./backup -restore <CommitID>
```

## 🧪 測試指南

### 測試情境
1. **群組觸發流程**：在群組輸入 `!whitelist`，完成完整跨頻道流程
2. **私訊直接流程**：在私訊輸入 `!whitelist`，完成直接驗證
3. **已認證用戶**：測試已認證用戶的命令響應

### 預期結果
- ✅ 標準化 Context 封裝正常
- ✅ 跨頻道交互記錄正確
- ✅ 安全發送機制正常
- ✅ 自動回傳群組正常

## 🛠️ 技術棧

- **WhatsApp Web API**: whatsapp-web.js
- **Node.js**: 運行環境
- **標準化架構**: 自定義 Context 管理系統
- **Git**: 版本控制與備份管理

## 📈 開發歷程

專案經過 6 個階段的系統性開發：

1. **Phase 1**: 基礎骨架與 QR 登入
2. **Phase 2**: 核心引擎與工具模組
3. **Phase 3**: 生產環境配置
4. **Phase 4**: 自動化流水線
5. **Phase 5**: 開放式認證與零攔截啟動
6. **Phase 6**: 標準化重構與跨頻道通訊協定

詳細進度報告請參考 `MarkDown/` 目錄。

## 🤝 貢獻指南

歡迎貢獻代碼！請遵循以下準則：

1. 使用標準化 Context 物件進行開發
2. 遵循跨頻道通訊協定
3. 添加適當的錯誤處理
4. 更新相關文檔

## 📄 許可證

此專案僅供學習和研究使用。

---

**EngineeringBot** - 專業級的 WhatsApp 機器人，具備標準化訊息處理架構與跨頻道通訊協定。 🚀# PBOTS
