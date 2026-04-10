# 📚 PBOTS 項目文檔索引

這是 PBOTS WhatsApp Bot 項目的統一文檔目錄。所有開發文檔、架構說明、階段報告和指南文件都組織在此目錄中。

## 📁 目錄結構

### 📋 架構文檔 (`architecture/`)
- **PBOTS_Standard_Architecture.md** - 項目標準架構規範（包含 group-pm-group 流程）
- **PBOTS_HANDLE_METHODS_ARCHITECTURE.md** - 處理方法架構說明
- **SYSTEM_MAP.md** - 系統架構圖

### 📊 階段報告 (`phases/`)
- **PHASE1_PROGRESS_REPORT.md** - 第1階段進度報告（基礎功能實現）
- **PHASE2_PROGRESS_REPORT.md** - 第2階段進度報告（工具模組化）
- **PHASE3_PROGRESS_REPORT.md** - 第3階段進度報告（安全與權限管理）
- **PHASE4_PROGRESS_REPORT.md** - 第4階段進度報告（私訊功能實現）
- **PHASE5_PROGRESS_REPORT.md** - 第5階段進度報告（Excel 邏輯引擎）
- **PHASE6_STANDARDIZATION_REPORT.md** - 第6階段進度報告（跨頻道通訊標準化）
- **PHASE_7_GROUP_SESSION_FIX.md** - 第7階段群組會話修復（!trial 與 !cancel 優化）

### 📖 指南文件 (`guides/`)
- **LLM_TRANSFER_GUIDE.md** - LLM 上下文轉移指南
- **PATH_MANAGEMENT_GUIDE.md** - 路徑管理指南（PathManager 使用說明）
- **PBOTS_PROJECT_OVERVIEW.md** - 項目概覽與功能介紹

### 🛠️ 技能文檔 (`skills/`)
- *準備擴展中...*

## 🎯 開發規範

### PathManager 路徑管理
所有路徑必須使用 PathManager 進行管理，禁止使用硬編碼路徑。

```javascript
// ✅ 正確用法
const filePath = PathManager.DOCS + '/architecture/PBOTS_Standard_Architecture.md';

// ❌ 錯誤用法  
const filePath = './docs/architecture/PBOTS_Standard_Architecture.md';
```

### 文檔更新規範
1. 所有新文檔必須放置在對應的分類目錄中
2. 文檔命名必須清晰描述內容
3. 更新文檔後必須更新此索引文件
4. 文檔中的路徑引用必須使用 PathManager 常量

## 🔧 快速查找

### 架構相關
- 標準架構規範 → `architecture/PBOTS_Standard_Architecture.md`
- 處理方法架構 → `architecture/PBOTS_HANDLE_METHODS_ARCHITECTURE.md`
- 系統架構圖 → `architecture/SYSTEM_MAP.md`

### 開發進度
- 階段報告 → `phases/` 目錄
- 當前階段 → `phases/PHASE_7_GROUP_SESSION_FIX.md`

### 技術指南
- LLM 上下文轉移 → `guides/LLM_TRANSFER_GUIDE.md`
- 路徑管理 → `guides/PATH_MANAGEMENT_GUIDE.md`
- 項目概覽 → `guides/PBOTS_PROJECT_OVERVIEW.md`

## 📱 項目狀態

**版本**: v3.0.0-GroupSession  
**狀態**: ✅ **第7階段群組對答優化完成**  
**最後更新**: 2026年4月10日  

### ✅ 核心功能
- 🤖 WhatsApp Bot 完整功能
- 🔧 模組化工具架構
- 🛡️ 安全管理與權限控制
- 📊 Excel 驅動邏輯引擎
- 🔄 群組-私訊-群組交互流程
- 🩺 健康監控系統

### 📁 統一管理架構
- **文檔管理**: `docs/` 目錄（當前位置）
- **備份管理**: `backups/` 目錄
- **工具管理**: `tools/` 目錄
- **配置管理**: `configs/` 目錄
- **數據管理**: `data/` 目錄

---
*最後更新: 2026年4月10日*