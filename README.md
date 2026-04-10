# 🤖 EngineeringBot - WhatsApp 工程機器人

**版本**: v3.0.0-GroupSession  
**狀態**: ✅ **第7階段群組對答優化完成 - 完整群組 Excel 填表功能**  
**最後更新**: 2026年4月10日  

## 🚀 專案概述

EngineeringBot 是一個功能完整的 WhatsApp 機器人，採用**最終大一統架構**，整合了所有分散的功能模組，特別是階段6的私訊與跨頻道通訊功能。專案經過系統性全域重構，具備專業級的開發基礎和防禦式加固架構。

## ✅ 核心特性

### 🏗️ 最終大一統架構
- **環境無關設計**：使用 PathManager 實現跨平台兼容
- **模組化架構**：所有功能模組位於 `/tools` 目錄
- **防禦式加固**：完整的錯誤處理和健康監控系統

### 🔧 完整功能模組
- **QR Code 掃描登入**：支持持久化會話管理
- **跨頻道通訊協定**：完整的群組-私訊-群組交互流程（階段6核心）
- **自動化工具集**：媒體下載、圖片轉PDF、訊息記錄、系統清理
- **健康監控系統**：24小時自動報告和異常檢測

### 🛡️ 第7階段群組對答優化
- **群組會話鎖定**：精準識別發起人，避免多人干擾
- **優先級處理**：LogicEngine 會話優先於常規命令
- **反饋確認機制**：@用戶 確認回覆，解決「無反應」恐懼
- **Excel 填表優化**：完整支援群組環境的 Excel 驅動填表

### 🛡️ 安全性與權限管理
- **白名單管理**：動態管理員權限分配
- **私訊驗證**：群組觸發私訊密碼驗證流程
- **防錯機制**：單一模組錯誤不影響系統運行

### 🛡️ 安全性
- **權限隔離**：白名單只認人，不認群組
- **身份混淆解決**：`message.from` 與 `message.author` 不再混淆
- **安全發送保證**：防止私密資訊誤發到群組

## 📁 專案結構

```
PBOTS/
├── working_bot.js         # 🎯 最終大一統主程式（唯一執行入口）
├── tools/                 # 🛠️ 完整工具模組集
│   ├── securityManager.js     # 安全管理與白名單系統
│   ├── contextStandardizer.js # 階段6私訊與跨頻道通訊
│   ├── messageLogger.js       # 完整訊息記錄系統
│   ├── mediaDownloader.js     # 媒體文件自動下載
│   ├── imageToPdf.js          # 圖片轉PDF工具
│   ├── cleanup.js             # 系統清理管理
│   ├── healthMonitor.js       # 健康監控系統
│   ├── commandHandler.js      # 統一指令處理器
│   ├── logicEngine.js         # 🆕 第7階段 Excel 邏輯引擎
│   ├── fix_trial_sheet.js     # 🆕 第7階段 Excel 修復工具
│   └── robot_map.xlsx         # 🆕 第7階段 Excel 邏輯地圖
├── configs/               # ⚙️ 配置管理
│   ├── path_manager.js   # 環境無關路徑管理
│   └── settings.json     # 應用配置
├── data/                 # 💾 數據存儲
│   ├── whitelist.json   # 動態白名單管理
│   └── contexts.json    # 跨頻道交互記錄
├── archive/              # 📚 歷史檔案備份
├── backups/              # 💼 系統備份
└── MarkDown/             # 📖 專案文檔
```

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 啟動機器人
```bash
node working_bot.js
```

### 掃描 QR Code
- 啟動後會顯示 QR Code
- 使用 WhatsApp 掃描登入
- 系統自動完成初始化

## 📋 可用指令

### 🎯 核心功能指令
- `!whitelist` - 申請管理員權限（支援跨頻道私訊驗證）
- `!memo` - 建立備忘錄
- `!profile` - 查看個人資料
- `!pdf` - 將最近圖片轉換為PDF
- `!excel` - Excel功能（開發中）

### 🔧 基礎功能指令
- `!help` - 顯示幫助訊息
- `!ping` - 測試機器人響應
- `!stats` - 查看今日統計數據
- `!version` - 查看機器人版本

## 🔧 進階功能

### 跨頻道私訊流程
1. **群組觸發**：在群組輸入 `!whitelist`
2. **私訊驗證**：機器人發送私訊要求密碼
3. **密碼輸入**：在私訊中回覆管理員密碼
4. **結果回傳**：機器人將結果回傳到原群組

### 自動化工具
- **媒體下載**：自動下載圖片、影片、文件
- **訊息記錄**：完整 JSON 格式聊天記錄
- **系統清理**：定期清理舊檔案和日誌
- **健康監控**：24小時系統狀態報告

## 📖 相關文檔

- [SYSTEM_MAP.md](SYSTEM_MAP.md) - 完整系統架構地圖
- [PATH_MANAGEMENT_GUIDE.md](PATH_MANAGEMENT_GUIDE.md) - 路徑管理指南
- [LLM_TRANSFER_GUIDE.md](LLM_TRANSFER_GUIDE.md) - LLM轉移指南
- [PHASE_7_GROUP_SESSION_FIX.md](PHASE_7_GROUP_SESSION_FIX.md) - 🆕 第7階段群組對答優化詳解

## 🛡️ 第7階段群組對答功能

### 群組 Excel 填表流程

#### 啟動流程
```
師傅A: !trial
📊 群組 [群組名稱] 鎖定用戶 [師傅A] 開始填表流程: trial
```

#### 多人干擾處理
```
師傅B: 亂入訊息
⛔ 群組 [群組ID] 已鎖定給用戶 [師傅A]，忽略用戶 [師傅B] 的訊息
```

#### 回答確認機制
```
師傅A: 啟德
@師傅A 收到: 啟德
📋 trial - 問題 2: 請選擇測試類型...
```

#### 流程完成
```
✅ LogicEngine 填表流程完成
📁 填表結果已保存: data/excel_results/trial_XXXXX_YYYY-MM-DD.xlsx
```

### 可用 Excel 填表指令
- `!工地巡查` - 啟動工地巡查填表流程
- `!報銷入數` - 啟動報銷申請填表流程
- `!trial` - 啟動測試專案填表流程

### 技術特性
- **群組鎖定**: 精準識別發起人，避免多人干擾
- **優先級處理**: LogicEngine 會話優先於常規命令
- **反饋確認**: @用戶 確認回覆，解決「無反應」恐懼
- **安全整合**: SecurityManager 權限檢查
- **路徑管理**: PathManager 標準化路徑生成

## 🛡️ 安全提醒

**管理員密碼**：`288365`（可在 `configs/settings.json` 中修改）

## 📞 支援

如有問題，請檢查系統日誌或參考相關文檔。

## 🎯 標準化架構

### Context 物件結構
```javascript
const context = {
  // 身份識別
  userId: "XXXXX@c.us",        // 發言人的個人 ID
  originId: "XXXXX@g.us", // 訊息的來源 ID
  isGroup: true,                    // 是否為群組訊息
  pushname: "阿A",                   // 用戶顯示名稱
  
  // 訊息內容
  messageBody: "!whitelist",
  message: messageObject,           // 原始訊息物件
  
  // 群組資訊
  groupName: "My private test",
  groupId: "XXXXX@g.us"
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
→ [用戶私訊回覆 XXXXX] 
→ [驗證成功] 
→ [私訊回覆：✅ 認證成功。] 
→ [自動回群組：✅ @用戶 認證成功，已獲取管理員權限。]
```

#### 私訊直接流程
```
[私訊輸入 !whitelist] 
→ [標準化 Context 封裝] 
→ [私訊回覆：請輸入管理員密碼] 
→ [用戶回覆 XXXXX] 
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
