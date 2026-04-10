# 📁 PBOTS 項目樹結構

## 項目根目錄
```
PBOTS/
├── 📄 README.md                    # 項目主文檔 (v3.0.0-GroupSession)
├── 📄 PROJECT_TREE.md               # 項目結構文檔
├── 📄 .env.example                 # 環境變數模板
├── 🔧 working_bot.js               # 主入口文件
├── 🔧 init_check.js                # 初始化檢查工具
├── 🔧 ecosystem.config.js          # PM2 配置
├── 📦 package.json                 # Node.js 依賴配置
├── 📦 package-lock.json            # 依賴鎖定文件

├── 📁 docs/                        # 📚 統一文檔管理
│   ├── 📄 README.md                # 文檔索引
│   ├── 📁 architecture/            # 架構文檔
│   │   ├── 📄 PBOTS_Standard_Architecture.md
│   │   ├── 📄 PBOTS_HANDLE_METHODS_ARCHITECTURE.md
│   │   └── 📄 SYSTEM_MAP.md
│   ├── 📁 phases/                  # 階段報告
│   │   ├── 📄 PHASE1_PROGRESS_REPORT.md
│   │   ├── 📄 PHASE2_PROGRESS_REPORT.md
│   │   ├── 📄 PHASE3_PROGRESS_REPORT.md
│   │   ├── 📄 PHASE4_PROGRESS_REPORT.md
│   │   ├── 📄 PHASE5_PROGRESS_REPORT.md
│   │   ├── 📄 PHASE6_STANDARDIZATION_REPORT.md
│   │   └── 📄 PHASE_7_GROUP_SESSION_FIX.md
│   └── 📁 guides/                  # 指南文件
│       ├── 📄 LLM_TRANSFER_GUIDE.md
│       ├── 📄 PATH_MANAGEMENT_GUIDE.md
│       └── 📄 PBOTS_PROJECT_OVERVIEW.md

├── 📁 tools/                       # 核心工具模組
│   ├── 📄 README.md                # 工具模組說明
│   ├── 🔧 logicEngine.js           # 邏輯引擎 (群組會話管理)
│   ├── 🔧 commandHandler.js        # 命令處理器
│   ├── 🔧 contextStandardizer.js   # 標準化 Context 管理
│   ├── 🔧 contextManager.js        # Context 管理器
│   ├── 🔧 securityManager.js       # 安全管理器
│   ├── 🔧 messageLogger.js         # 訊息記錄器
│   ├── 🔧 mediaDownloader.js       # 媒體下載器
│   ├── 🔧 imageToPdf.js            # 圖片轉 PDF
│   ├── 🔧 healthMonitor.js         # 健康監控
│   ├── 🔧 cleanup.js               # 系統清理
│   ├── 🔧 add_trial_sheet.js       # 試用表格工具
│   ├── 🔧 create_excel_map.js      # Excel 地圖創建
│   ├── 🔧 create_multi_sheet_excel.js # 多工作表 Excel
│   ├── 🔧 fix_trial_sheet.js       # 試用表格修復
│   └── 📊 robot_map.xlsx           # 機器人地圖 Excel

├── 📁 configs/                     # 配置檔案
│   ├── 📄 README.md
│   ├── 🔧 path_manager.js          # 路徑管理配置
│   └── 📄 settings.json            # 主要配置

├── 📁 data/                        # 數據存儲
│   ├── 📄 README.md
│   ├── 📄 whitelist.json           # 白名單數據
│   ├── 📄 contexts.json            # Context 會話數據
│   └── 📁 chats/                   # 聊天記錄
│       └── 📄 2026-04-09.json

├── 📁 backups/                     # 備份文件
│   ├── 📄 README.md
│   └── 📁 full_backup_20260410_150226/ # 完整備份

├── 📁 .trae/skills/                # Trae AI 技能
│   └── 📁 LLMmark/
│       └── 📄 SKILL.md             # LLMmark 技能文件

└── 📁 src/                         # 源代碼目錄
    └── 📄 README.md
```

## 核心文件說明

### 主入口文件
- **working_bot.js** - 最終大一統架構的主入口
- **init_check.js** - 系統初始化檢查工具

### 核心工具模組
- **logicEngine.js** - Phase 7 群組會話邏輯引擎
- **commandHandler.js** - 統一命令處理器
- **contextStandardizer.js** - Phase 6 標準化 Context 系統

### 重要文檔
- **README.md** - 項目主文檔 (v3.0.0)
- **LLM_TRANSFER_GUIDE.md** - LLM 上下文轉移指南
- **SYSTEM_MAP.md** - 系統架構地圖

### 配置與數據
- **.env.example** - 環境變數模板
- **configs/settings.json** - 主要配置
- **data/whitelist.json** - 白名單數據

## 技術架構

### Phase 6 標準化架構
- ✅ 標準化 Context 系統
- ✅ 跨頻道通訊協定
- ✅ 身份混淆解決

### Phase 7 群組會話優化
- ✅ 群組會話鎖定機制
- ✅ 優先級處理系統
- ✅ 反饋確認機制
- ✅ Excel 填表功能

### 安全機制
- ✅ 白名單管理
- ✅ 私訊驗證流程
- ✅ 防錯加固架構

---
**最後更新**: 2026年4月10日  
**項目版本**: v3.0.0-GroupSession