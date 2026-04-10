# 🤖 LLM 系統轉移指南 - EngineeringBot

**專案名稱**: EngineeringBot - WhatsApp 工程機器人  
**目標用戶**: 香港 Site Supervisor  
**當前階段**: Phase 7 群組對答優化完成  
**版本**: v2.0.0-GroupSession  
**最後更新**: 2026年4月10日  

---

## 🎯 項目概況

### 基本資訊
- **專案類型**: WhatsApp 機器人 (使用 whatsapp-web.js)
- **開發語言**: Node.js
- **目標用戶**: 香港 Site Supervisor
- **當前狀態**: Phase 7 群組對答優化已完成，支援完整群組 Excel 填表功能

### 核心技術棧
- **WhatsApp Web API**: whatsapp-web.js
- **標準化架構**: 自定義 Context 管理系統
- **跨頻道通訊**: 群組-私訊-群組交互協議
- **安全機制**: 白名單驗證與權限控制

---

## 🔧 Phase 6 標準化協議

### 身份識別標準化

#### userId (個人身份標識)
- **定義**: `contact.id._serialized`
- **用途**: 永遠指向發言人的個人 WhatsApp ID
- **格式**: `XXXXX@c.us`
- **重要性**: 所有白名單檢查、資料庫讀寫必須使用此 ID

#### originId (來源標識)
- **定義**: `message.from`
- **用途**: 永遠指向訊息的來源 ID（群組或私訊）
- **格式**: 群組 `XXXXX@g.us`，私訊 `XXXXX@c.us`
- **重要性**: 用於跨頻道回傳原點

### 標準化 Context 物件結構

```javascript
const context = {
  // 身份識別 (必須使用)
  userId: "XXXXX@c.us",        // 發言人的個人 ID
  originId: "XXXXX@g.us", // 訊息的來源 ID
  isGroup: true,                    // 是否為群組訊息
  pushname: "阿A",                   // 用戶顯示名稱
  
  // 訊息內容
  messageBody: "!whitelist",
  message: messageObject,           // 原始訊息物件
  
  // 群組資訊（僅群組時有效）
  groupName: "My private test",
  groupId: "XXXXX@g.us"
}
```

### 2b 模式邏輯：群組觸發 -> 私訊互動 -> 原群組回報

#### 完整流程示例
```
[群組輸入 !whitelist] 
→ [標準化 Context 封裝] 
→ [記錄跨頻道交互] 
→ [群組回覆：請檢查私訊] 
→ [安全發送私訊：請輸入管理員密碼] 
→ [用戶私訊回覆 XXXXX] 
→ [驗證成功] 
→ [私訊回覆：✅ 認證成功。] 
→ [自動回群組：✅ @用戶 認證成功，已獲取管理員權限。]
```

#### 技術實現要點
1. **記錄交互**: `contextStandardizer.recordInteraction(context, command)`
2. **安全發送**: `contextStandardizer.safeSendMessage(client, targetId, content, context)`
3. **自動回傳**: 使用記錄的 `originId` 回傳原群組
4. **清理記錄**: `contextStandardizer.completeInteraction(userId)`

---

## 📁 現有檔案架構

### 核心源代碼 (`src/`)

#### `src/index_refactored.js` (主要使用)
- **作用**: 重構後的主入口文件，採用標準化 Context 架構
- **特性**: 
  - 標準化訊息預處理器
  - 跨頻道交互狀態管理
  - 安全發送機制

#### `src/index.js` (舊版本)
- **作用**: 原始主入口文件，部分重構
- **狀態**: 建議使用 `index_refactored.js`

### 標準化工具 (`tools/`)

#### `tools/contextStandardizer.js` (核心組件)
- **作用**: 標準化 Context 管理器
- **關鍵方法**:
  - `standardizeContext(message)` - 封裝標準化 Context
  - `recordInteraction(context, command)` - 記錄跨頻道交互
  - `safeSendMessage(client, targetId, content, context)` - 安全發送
  - `getActiveInteraction(userId)` - 獲取交互記錄
  - `completeInteraction(userId)` - 完成交互

#### 其他核心工具
- `tools/securityManager.js` - 安全管理器 (白名單、權限控制)
- `tools/messageLogger.js` - 訊息日誌系統
- `tools/mediaDownloader.js` - 媒體文件下載器
- `tools/imageToPdf.js` - 圖片轉 PDF 工具
- `tools/cleanup.js` - 系統清理管理器

### 配置檔案 (`configs/`)
- `configs/settings.json` - 主要配置檔案
- **權限級別**: `public`, `basic`, `authorized`, `admin`

---

## 🛡️ 安全性規範

### !whitelist 驗證機制

#### 驗證流程
1. **觸發條件**: 任何用戶輸入 `!whitelist`
2. **權限檢查**: 公開命令，完全跳過權限攔截
3. **跨頻道交互**: 群組觸發時記錄 `originId`
4. **密碼驗證**: 私訊中輸入管理員密碼
5. **結果回傳**: 驗證成功後自動回原群組

#### 密碼邏輯
- **正確密碼**: `XXXXX`
- **安全性**: 絕對不在任何訊息中顯示實際密碼
- **提示訊息**: "請輸入管理員密碼以獲取權限。"

### 白名單管理
- **存儲位置**: `data/whitelist.json`
- **驗證方式**: 使用 `context.userId` 進行檢查
- **即時生效**: 認證成功後權限立即生效

---

## 🎯 開發中目標：Site Memo 功能

### 功能需求
為 Site Supervisor 開發 Site Memo 記錄功能，支持跨頻道交互。

### JSON 結構需求

#### Site Memo 數據結構
```json
{
  "memoId": "unique_identifier",
  "siteName": "工地名稱",
  "supervisor": "監督員姓名", 
  "date": "2026-04-09",
  "time": "14:30",
  "location": "具體位置",
  "memoType": "inspection|safety|progress|issue",
  "priority": "low|medium|high|urgent",
  "description": "詳細描述",
  "actionsRequired": ["行動項目1", "行動項目2"],
  "attachments": ["image1.jpg", "pdf1.pdf"],
  "status": "draft|submitted|approved|completed",
  "createdBy": "userId",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 2b 交互流程設計

#### 群組觸發流程
```
[群組輸入 !sitememo] 
→ [記錄跨頻道交互] 
→ [群組回覆：請檢查私訊填寫 Site Memo] 
→ [私訊發送表單：請選擇 Memo 類型...] 
→ [用戶私訊逐步填寫表單] 
→ [表單完成，確認提交] 
→ [私訊回覆：✅ Site Memo 已提交] 
→ [自動回群組：✅ @用戶 已提交 Site Memo (編號: XXX)]
```

#### 私訊直接流程
```
[私訊輸入 !sitememo] 
→ [直接發送表單填寫] 
→ [用戶逐步填寫表單] 
→ [表單完成，確認提交] 
→ [私訊回覆：✅ Site Memo 已提交]
```

### 技術實現要點

#### 1. 標準化 Context 使用
```javascript
async function handleSiteMemoCommand(context) {
    // 必須使用標準化 Context
    const command = context.messageBody.split(' ')[0].toLowerCase().trim();
    
    // 記錄跨頻道交互
    if (context.isGroup) {
        contextStandardizer.recordInteraction(context, command);
    }
    
    // 安全發送私訊
    await contextStandardizer.safeSendMessage(
        client, 
        context.userId, 
        "請選擇 Site Memo 類型...", 
        context
    );
}
```

#### 2. 表單狀態管理
- 使用 `contextStandardizer.activeInteractions` 管理表單狀態
- 每個步驟記錄當前進度
- 支持中途取消和重新開始

#### 3. 數據存儲
- 存儲位置: `data/site_memos/`
- 文件命名: `memo_{timestamp}_{userId}.json`
- 備份機制: 自動備份到 `backups/site_memos/`

---

## 💡 開發準則

### 代碼規範
1. **必須使用** `context.userId` 而不是其他用戶標識
2. **所有訊息發送** 必須使用 `contextStandardizer.safeSendMessage()`
3. **跨頻道交互** 必須記錄和清理交互狀態
4. **錯誤處理** 必須包含完善的異常處理

### 安全性要求
1. **絕對不顯示** 敏感信息（如密碼）在群組中
2. **所有用戶輸入** 必須進行驗證和清理
3. **文件操作** 必須包含路徑安全檢查

### 測試要求
1. **測試群組觸發流程** 確保跨頻道交互正常
2. **測試私訊直接流程** 確保單頻道交互正常
3. **測試錯誤情況** 確保異常處理正常

---

## 📋 快速參考

### 常用代碼片段

#### 標準化命令處理
```javascript
async function handleCommand(context) {
    const command = context.messageBody.split(' ')[0].toLowerCase().trim();
    
    // 必須使用標準化 Context
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

#### 跨頻道交互實現
```javascript
// 記錄交互
contextStandardizer.recordInteraction(context, command);

// 獲取交互記錄
const interaction = contextStandardizer.getActiveInteraction(context.userId);

// 完成交互
contextStandardizer.completeInteraction(context.userId);
```

### 重要提醒
- ✅ **已完成 Phase 6 標準化重構**
- ✅ **標準化 Context 架構就緒**
- ✅ **跨頻道通訊協議就緒**
- ✅ **已完成 Phase 7 群組對答優化**
- 🎯 **當前目標：開發 Site Memo 功能**

---

## 🔧 Phase 7 群組對答優化

### 核心問題解決

#### 問題1：群組對答癱瘓
- **症狀**: 群組內多人同時輸入，Bot 無法識別正確發起人
- **解決方案**: 實作群組會話鎖定機制
- **技術實現**: `groupSessions` Map 結構，`chatId` + `userId` 雙重識別

#### 問題2：!cancel 死循環
- **症狀**: 非 !cancel 輸入錯誤導向取消流程
- **解決方案**: 修復 NextID 邏輯，正確處理流程終止
- **技術實現**: 運行 `fix_trial_sheet.js` 修復 Excel 邏輯

#### 問題3：反饋缺失
- **症狀**: 用戶回答後無明確反饋，產生「無反應」恐懼
- **解決方案**: 實作 @用戶 確認回覆機制
- **技術實現**: `question_with_confirmation` 類型，雙重訊息發送

### 技術架構改動

#### LogicEngine 群組鎖定機制
```javascript
// 群組會話緩存 (chatId -> userId)
this.groupSessions = new Map();

// 檢查群組會話鎖定
isGroupSessionLocked(chatId, userId) {
    const lockedUserId = this.groupSessions.get(chatId);
    if (lockedUserId && lockedUserId !== userId) {
        console.log(`⛔ 群組 ${chatId} 已鎖定給用戶 ${lockedUserId}，忽略用戶 ${userId} 的訊息`);
        return true;
    }
    return false;
}
```

#### 優先級處理系統
- **LogicEngine 會話優先**: 用戶在會話中時，優先處理 LogicEngine 訊息
- **群組鎖定檢查**: 群組內只處理發起人的訊息
- **反饋確認機制**: 實作 @用戶 確認回覆

### 群組對答流程示例

1. **師傅 A 在群組中輸入** `!trial`
   ```
   📊 群組 [群組名稱] 鎖定用戶 [師傅A] 開始填表流程: trial
   ```

2. **師傅 B 亂入**
   ```
   ⛔ 群組 [群組ID] 已鎖定給用戶 [師傅A]，忽略用戶 [師傅B] 的訊息
   ```

3. **師傅 A 回答「啟德」**
   ```
   📝 用戶 [師傅A] 在 LogicEngine 會話中回答: 啟德
   @師傅A 收到: 啟德
   ```

4. **流程完成**
   ```
   ✅ LogicEngine 填表流程完成
   📁 填表結果已保存: data/excel_results/trial_XXXXX_YYYY-MM-DD.xlsx
   ```

### 安全深度整合

#### SecurityManager 整合
- **權限檢查**: 所有 Excel 填表流程都受到 SecurityManager 檢查
- **構造函數注入**: LogicEngine 支援 SecurityManager 參數傳入
- **權限級別**: 使用 'basic' 權限級別進行檢查

#### PathManager 整合
- **標準化路徑**: 使用 PathManager 定義的路徑生成結果檔案
- **檔案命名**: `工作表名稱_用戶ID_時間戳.xlsx`
- **結果位置**: `data/excel_results/` 資料夾

### 效能優化

#### 響應時間
- **群組鎖定檢查**: O(1) 時間複雜度
- **會話狀態檢查**: O(1) 時間複雜度
- **優先級處理**: 減少不必要的命令解析

#### 記憶體使用
- **會話緩存**: Map 結構，高效記憶體使用
- **群組鎖定**: 最小化鎖定範圍，避免記憶體洩漏

### 新增功能組件

| 組件 | 功能 | 檔案位置 |
|------|------|----------|
| 群組會話管理系統 | 群組鎖定狀態管理 | `tools/logicEngine.js` |
| 優先級處理系統 | LogicEngine 會話優先處理 | `working_bot.js` |
| 反饋確認機制 | @用戶 確認回覆 | `tools/logicEngine.js` |
| 安全整合系統 | SecurityManager 深度整合 | 多個檔案 |

### 開發規範

#### 群組對答開發
- **必須使用** `isGroupSessionLocked()` 檢查群組鎖定
- **必須實作** 反饋確認機制
- **必須整合** SecurityManager 權限檢查
- **必須使用** PathManager 標準化路徑

#### 錯誤處理
- **群組鎖定異常**: 記錄日誌並忽略非發起人訊息
- **Excel 邏輯錯誤**: 運行修復腳本修正 NextID 問題
- **權限檢查失敗**: 返回權限不足提示

### 測試要求

#### 群組環境測試
- ✅ **單人啟動**: 師傅 A 啟動 !trial 流程
- ✅ **多人干擾**: 師傅 B 亂入被無視
- ✅ **反饋確認**: @用戶 確認回覆正常
- ✅ **流程完成**: 結果檔案正確生成

#### 權限測試
- ✅ **白名單用戶**: 正常執行 Excel 填表
- ✅ **非白名單用戶**: 權限不足提示
- ✅ **權限檢查**: SecurityManager 整合正常

---

**📝 使用說明**: 複製此文件全部內容，貼到新的 LLM 對話視窗，即可快速建立專案上下文。

**EngineeringBot - 專業級的 WhatsApp 機器人，具備標準化訊息處理架構與跨頻道通訊協定** 🚀