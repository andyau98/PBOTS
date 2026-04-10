# PBOTS Handle 方法架構文檔

## 📊 總覽

PBOTS 系統目前包含 **23 種不同的 handle 方法**，分佈在 5 個主要工具中。這些方法分為標準化新方法和需要淘汰的舊方法。

## 🔧 方法分類統計

### 按工具分類：
- **SecurityManager**: 4種 (3新 + 1舊)
- **CommandHandler**: 11種 (1新 + 10舊) 
- **PrivateMessageHandler**: 3種 (1新 + 2舊)
- **ExcelHandler**: 2種 (1新 + 1舊)
- **ProfileHandler**: 1種 (1新)
- **輔助方法**: 1種 (核心)

### 按狀態分類：
- **標準化新方法**: 7種 (用於 execute 方法)
- **需要淘汰舊方法**: 15種 (舊參數格式)
- **核心保留方法**: 1種 (密碼驗證)

## 🏗️ 標準化架構演進

### 從舊架構到新架構：
```javascript
// 舊架構 (需要淘汰)
handleCommand(message, commandText, senderName, userId)

// 新架構 (標準化)
execute(context, command) → handleCommandLogic(context, command)
```

### 標準化優勢：
1. **統一接口**：所有工具使用相同的 execute 方法
2. **上下文標準化**：使用統一的 context 對象
3. **錯誤處理統一**：標準化的錯誤處理機制
4. **權限檢查統一**：統一的權限檢查流程

## 📋 詳細方法列表

### 1. SecurityManager - 安全與權限管理

#### 標準化新方法 (3種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleSecurityCommand(context, command)` | 安全命令統一處理器 | ✅ 新標準化 |
| `handleWhitelistCommand(context)` | 白名單命令處理器 | ✅ 新標準化 |
| `handleAuthCommand(context)` | 認證命令處理器 | ✅ 新標準化 |

#### 需要淘汰舊方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleWhitelistCommand(message, commandText, userId)` | 舊版白名單處理器 | ❌ 需要淘汰 |

#### 核心保留方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handlePasswordVerification(message, password, userId, isGroup, groupName)` | 密碼驗證處理器 | 🔧 核心保留 |

### 2. CommandHandler - 統一指令處理器

#### 標準化新方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleCommandLogic(context, command)` | 命令邏輯統一處理器 | ✅ 新標準化 |

#### 需要淘汰舊方法 (10種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleCommand(message, commandText, senderName, userId)` | 舊版命令處理器 | ❌ 需要淘汰 |
| `handleHelp(message, commandText, senderName, userId)` | 幫助命令處理器 | ❌ 需要淘汰 |
| `handlePing(message, commandText, senderName, userId)` | 響應測試處理器 | ❌ 需要淘汰 |
| `handleStats(message, commandText, senderName, userId)` | 統計信息處理器 | ❌ 需要淘汰 |
| `handleVersion(message, commandText, senderName, userId)` | 版本信息處理器 | ❌ 需要淘汰 |
| `handleWhitelist(message, commandText, senderName, userId)` | 白名單處理器 | ❌ 需要淘汰 |
| `handleMemo(message, commandText, senderName, userId)` | 備忘錄處理器 | ❌ 需要淘汰 |
| `handleProfile(message, commandText, senderName, userId)` | 個人資料處理器 | ❌ 需要淘汰 |
| `handleExcel(message, commandText, senderName, userId)` | Excel 功能處理器 | ❌ 需要淘汰 |
| `handlePdf(message, commandText, senderName, userId)` | PDF 功能處理器 | ❌ 需要淘汰 |
| `handleTrial(message, commandText, senderName, userId)` | 試用功能處理器 | ❌ 需要淘汰 |

### 3. PrivateMessageHandler - 私訊處理器

#### 標準化新方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handlePrivateMessageLogic(context, command)` | 私訊邏輯處理器 | ✅ 新標準化 |

#### 需要淘汰舊方法 (2種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handlePrivateMessageReply(client, context)` | 私訊回覆處理器 | ❌ 需要淘汰 |
| `handleAllPrivateMessages(client, context)` | 所有私訊處理器 | ❌ 需要淘汰 |

### 4. ExcelHandler - Excel 處理器

#### 標準化新方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleExcelCommand(context)` | Excel 命令處理器 | ✅ 新標準化 |

#### 需要淘汰舊方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleExcelFormCommand(context)` | Excel 表單處理器 | ❌ 需要淘汰 |

### 5. ProfileHandler - 個人資料處理器

#### 標準化新方法 (1種)
| 方法名稱 | 功能描述 | 狀態 |
|---------|---------|------|
| `handleProfileCommand(context)` | 個人資料命令處理器 | ✅ 新標準化 |

## 🎯 標準化 execute 方法規範

### 標準化 execute 方法模板
```javascript
async execute(context, command) {
    try {
        // 1. 權限檢查 (SecurityManager 除外)
        if (!this.securityManager.isWhiteListed(context.userId)) {
            throw new Error('🚫 權限不足');
        }
        
        // 2. 跨頻道處理
        if (this.contextStandardizer) {
            await this.contextStandardizer.recordInteraction(context, command);
        }
        
        // 3. 執行業務邏輯
        return await this.handleBusinessLogic(context, command);
        
    } catch (error) {
        console.error('❌ execute 錯誤:', error.message);
        throw error;
    }
}
```

### 標準化 Context 對象結構
```javascript
{
    userId: string,           // 用戶ID
    pushname: string,         // 用戶顯示名稱
    messageBody: string,      // 訊息內容
    isGroup: boolean,         // 是否群組訊息
    groupName: string,        // 群組名稱 (如果是群組)
    originId: string,         // 原始ID (群組ID或用戶ID)
    message: Object           // 原始訊息對象
}
```

## 🔄 遷移計劃

### 第一階段：已完成
- ✅ SecurityManager 標準化
- ✅ ProfileHandler 標準化
- ✅ ExcelHandler 標準化
- ✅ PrivateMessageHandler 標準化

### 第二階段：進行中
- 🔄 CommandHandler 標準化 (部分完成)
- 🔄 working_bot.js 調用遷移 (部分完成)

### 第三階段：待完成
- ⏳ 淘汰所有舊方法
- ⏳ 統一錯誤處理機制
- ⏳ 完善測試覆蓋

## 📈 架構演進路線圖

### Phase 1: 基礎標準化 (已完成)
- 定義標準化 execute 方法
- 建立統一的 context 對象
- 實現基礎的權限檢查

### Phase 2: 工具遷移 (進行中)
- 遷移所有工具到新架構
- 更新 working_bot.js 調用
- 確保向後兼容性

### Phase 3: 優化完善 (待完成)
- 淘汰所有舊方法
- 優化錯誤處理機制
- 完善文檔和測試

## 🚀 技術優勢

### 1. 可維護性
- 統一的代碼結構
- 清晰的職責分離
- 易於擴展和修改

### 2. 可測試性
- 每個工具可以獨立測試
- 標準化的測試接口
- 模擬 context 對象進行測試

### 3. 安全性
- 統一的權限檢查機制
- 標準化的錯誤處理
- 防止權限檢查死循環

### 4. 可擴展性
- 新增功能只需遵循相同規範
- 易於集成新工具
- 支持插件式架構

## 📋 使用指南

### 新增工具開發規範
```javascript
class NewTool {
    constructor(config, securityManager, pathManager = null, contextStandardizer = null) {
        this.config = config;
        this.securityManager = securityManager;
        this.pathManager = pathManager || require('../configs/path_manager');
        this.contextStandardizer = contextStandardizer;
    }
    
    async execute(context, command) {
        // 標準化實現...
    }
    
    async handleBusinessLogic(context, command) {
        // 業務邏輯實現...
    }
}
```

### 現有工具遷移指南
1. 添加標準化 execute 方法
2. 創建對應的 handleBusinessLogic 方法
3. 更新 working_bot.js 中的調用
4. 測試確保功能正常
5. 逐步淘汰舊方法

---

**文檔版本**: v1.0  
**最後更新**: 2026年4月10日  
**適用範圍**: PBOTS Phase 7 架構標準化