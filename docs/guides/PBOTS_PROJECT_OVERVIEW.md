# 🤖 PBOTS 項目完整概述 - EngineeringBot

## 🎯 項目基本信息

**項目名稱**: PBOTS - EngineeringBot WhatsApp 機器人  
**當前版本**: v3.0.0-GroupSession  
**開發階段**: Phase 7 群組對答優化完成  
**最後更新**: 2026年4月10日  
**目標用戶**: 香港 Site Supervisor  

## 🏗️ 技術架構概述

### 核心技術棧
- **平台**: Node.js + WhatsApp Web API (whatsapp-web.js)
- **架構**: 最終大一統架構 (Final Unified Architecture)
- **通訊**: 跨頻道通訊協定 (Group-PM-Group Protocol)
- **安全**: 白名單驗證與權限控制

### Phase 6 標準化架構 (已完成)
- ✅ **標準化 Context 系統** - 解決身份混淆問題
- ✅ **跨頻道通訊協定** - 群組-私訊-群組完整流程
- ✅ **安全性標準化** - 統一的白名單驗證機制

### Phase 7 群組會話優化 (已完成)
- ✅ **群組會話鎖定** - 精準識別發起人，避免多人干擾
- ✅ **優先級處理** - LogicEngine 會話優先於常規命令
- ✅ **反饋確認機制** - @用戶 確認回覆，解決「無反應」恐懼
- ✅ **Excel 填表優化** - 完整支援群組環境的 Excel 驅動填表

## 📁 項目文件結構

### 核心文件
```
📄 README.md                    # 項目主文檔 (v3.0.0)
📄 LLM_TRANSFER_GUIDE.md        # LLM 轉移指南 (詳細技術上下文)
📄 SYSTEM_MAP.md                # 系統架構地圖
📄 PROJECT_TREE.md              # 項目樹結構 (本文件)
🔧 working_bot.js               # 主入口文件 (最終大一統架構)
🔧 init_check.js                # 系統初始化檢查
```

### 工具模組 (`/tools/`)
```
🔧 logicEngine.js           # 邏輯引擎 (Phase 7 核心)
🔧 commandHandler.js        # 統一命令處理器
🔧 contextStandardizer.js   # Context 標準化 (Phase 6 核心)
🔧 securityManager.js       # 安全管理器
🔧 messageLogger.js         # 訊息記錄
🔧 mediaDownloader.js       # 媒體下載
🔧 imageToPdf.js            # 圖片轉 PDF
🔧 healthMonitor.js         # 健康監控
🔧 cleanup.js               # 系統清理
🔧 add_trial_sheet.js       # 試用表格工具
🔧 create_excel_map.js      # Excel 地圖創建
🔧 create_multi_sheet_excel.js # 多工作表 Excel
📊 robot_map.xlsx           # 機器人地圖 Excel
```

### 配置與數據
```
📄 .env.example             # 環境變數模板
📁 configs/                 # 配置檔案
📁 data/                    # 數據存儲
📁 backups/                 # 備份文件
```

## 🔧 核心功能模組

### 1. LogicEngine (Phase 7 核心)
**文件**: `tools/logicEngine.js`  
**功能**: 群組會話管理和 Excel 填表邏輯  
**特性**:
- 群組會話鎖定 (`isGroupSessionLocked()`)
- 優先級處理 (LogicEngine > 常規命令)
- 反饋確認機制 (@用戶 確認)
- Excel 驅動填表流程

### 2. ContextStandardizer (Phase 6 核心)
**文件**: `tools/contextStandardizer.js`  
**功能**: 標準化訊息上下文管理  
**核心 Context 結構**:
```javascript
const context = {
  userId: "XXXXX@c.us",        // 發言人的個人 ID
  originId: "XXXXX@g.us",      // 訊息的來源 ID
  isGroup: true,               // 是否為群組訊息
  pushname: "阿A",             // 用戶顯示名稱
  messageBody: "!whitelist",   // 訊息內容
  groupName: "My private test", // 群組名稱
  groupId: "XXXXX@g.us"        // 群組 ID
}
```

### 3. CommandHandler
**文件**: `tools/commandHandler.js`  
**功能**: 統一命令處理和路由  
**支持命令**:
- `!ping` - 系統狀態檢查
- `!whitelist` - 白名單認證 (密碼: XXXXX)
- `!security` - 安全狀態檢查
- `!trial` - 試用表格填表
- `!工地巡查` - 工地巡查填表
- `!報銷入數` - 報銷申請填表

### 4. SecurityManager
**文件**: `tools/securityManager.js`  
**功能**: 權限管理和白名單驗證  
**驗證流程**:
1. 群組輸入 `!whitelist`
2. 私訊要求輸入密碼
3. 驗證成功後寫入白名單
4. 群組回報認證結果

## 🚀 啟動與使用

### 快速啟動
```bash
# 1. 安裝依賴
npm install

# 2. 配置環境變數
cp .env.example .env
# 編輯 .env 填入實際配置

# 3. 啟動機器人
node working_bot.js

# 4. 掃描 QR Code 登入
```

### 系統檢查
```bash
# 運行初始化檢查
node init_check.js
```

### 可用命令示例
```
# 群組環境
!trial                    # 啟動試用表格填表
!工地巡查                 # 啟動工地巡查填表
!報銷入數                 # 啟動報銷申請填表

# 系統命令
!ping                     # 系統狀態檢查
!whitelist                # 白名單認證
!security                 # 安全狀態檢查
!help                     # 幫助信息
```

## 🛡️ 安全機制

### 身份驗證
- **白名單管理**: 動態管理員權限分配
- **私訊驗證**: 群組觸發私訊密碼驗證流程
- **權限檢查**: SecurityManager 整合權限驗證

### 數據保護
- **環境變數隔離**: 敏感信息存儲在 `.env`
- **Git 忽略規則**: 保護敏感文件和日誌
- **備份系統**: 自動化備份管理

### 錯誤處理
- **防錯機制**: 單一模組錯誤不影響系統運行
- **健康監控**: 24小時自動報告和異常檢測
- **日誌記錄**: 完整的操作日誌和錯誤追蹤

## 📊 技術特性

### 跨平台兼容
- **環境無關設計**: 使用 PathManager 實現跨平台兼容
- **路徑標準化**: 自動處理 Mac/Windows 路徑差異
- **模組化架構**: 所有功能模組位於 `/tools` 目錄

### 可擴展性
- **插件式架構**: 新功能可作為獨立模組添加
- **標準化接口**: 統一的 Context 和命令處理接口
- **文檔完整**: 詳細的開發指南和技術文檔

### 性能優化
- **會話管理**: 高效的群組會話鎖定機制
- **資源管理**: 自動清理和資源回收
- **監控系統**: 實時性能監控和報告

## 🔄 開發流程

### 新功能開發
1. **分析需求** - 參考 `SYSTEM_MAP.md` 和現有架構
2. **創建模組** - 在 `/tools/` 目錄添加新模組
3. **集成測試** - 使用 `init_check.js` 驗證功能
4. **文檔更新** - 更新相關文檔和指南

### 錯誤修復
1. **日誌分析** - 檢查系統日誌和錯誤信息
2. **模組隔離** - 定位具體問題模組
3. **測試驗證** - 使用測試用例驗證修復
4. **文檔更新** - 記錄修復過程和解決方案

## 📈 項目發展歷程

### Phase 1-5: 基礎架構
- 目錄結構建立
- 核心引擎開發
- 生產環境配置
- 自動化流水線

### Phase 6: 標準化重構
- 標準化 Context 系統
- 跨頻道通訊協定
- 安全性標準化

### Phase 7: 群組會話優化
- 群組會話鎖定機制
- Excel 填表功能
- 防禦式加固架構

## 🎯 下一步發展方向

### 短期目標
- 優化 Excel 填表性能
- 增強錯誤處理機制
- 完善測試用例

### 長期目標
- 擴展更多業務場景
- 集成更多第三方服務
- 實現集群部署支持

---

## 📞 技術支援

### 重要文件參考
- **`LLM_TRANSFER_GUIDE.md`** - 詳細的技術上下文轉移指南
- **`SYSTEM_MAP.md`** - 系統架構和模組關係圖
- **`PROJECT_TREE.md`** - 完整的項目文件結構

### 開發環境
- **Node.js 版本**: 建議使用最新 LTS 版本
- **操作系統**: 支持 macOS、Windows、Linux
- **依賴管理**: 使用 npm 或 yarn

### 問題排查
1. 檢查系統日誌 (`logs/` 目錄)
2. 運行 `node init_check.js` 進行系統檢查
3. 參考相關階段報告文檔 (`MarkDown/` 目錄)

---

**📝 使用說明**: 此文件提供 PBOTS 項目的完整技術概述，供 Gemini LLM 或其他 AI 助手快速建立項目上下文，繼續開發工作。

**EngineeringBot - 專業級的 WhatsApp 機器人，具備最終大一統架構與完整的群組 Excel 填表功能** 🚀