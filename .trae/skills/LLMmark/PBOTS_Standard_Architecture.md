# PBOTS Phase 7 開發規範 - LogicEngine 群組對答優化

## 1. 核心架構原則

### 1.1 路徑管理規範
- **必須使用** `configs/path_manager.js` 管理所有路徑
- **嚴禁使用** 相對路徑字串（如 `./data/`）
- **必須使用** `PathManager.DATA`、`PathManager.TOOLS` 等常量

### 1.2 LogicEngine 群組會話鎖規範
- **會話鎖定**：以 `originId` 為 Key 鎖定群組會話
- **發起人識別**：只接收 `userId`（發起者）的訊息
- **精準過濾**：非發起人的訊息一律無視

### 1.3 互動反饋規範 - group-pm-group 流程
- **群組觸發**：群組中啟動流程，提示用戶檢查私訊
- **私訊互動**：所有問題和回答在私訊中進行
- **確認回覆**：每次收到回答回覆 `收到: [內容]`
- **原群組回報**：完成後在群組中回報結果
- **避免 @ 標記**：不使用 `@pushname` 前綴，避免群組干擾

### 1.4 group-pm-group 流程規範
- **群組觸發原則**：所有需要用戶輸入的流程必須在群組中觸發
- **私訊互動原則**：所有具體操作在私訊中進行
- **原群組回報原則**：完成後必須在原始群組中回報結果
- **避免群組干擾**：不使用 `@` 標記，避免影響其他用戶

### 1.5 中斷邏輯規範
- **立即終止**：偵測到 `!cancel` 必須立刻清理 Map 緩存
- **會話清理**：刪除 `userSessions` 和 `groupSessions` 中的相關記錄
- **狀態重置**：確保會話狀態完全重置
- **跨頻道清理**：同時清理群組和私訊中的會話狀態

## 2. LogicEngine 重構標準

### 2.1 會話管理結構
```javascript
// groupSessions Map 結構
groupSessions: Map<originId, {
  initiatorId: string,      // 發起人 ID
  currentStep: string,      // 當前步驟
  data: Map<string, any>    // 會話數據
}>
```

### 2.2 邏輯攔截機制
```javascript
// 在處理訊息時，若該群組已有會話，非發起人的訊息一律無視
if (isGroup && this.isGroupSessionLocked(originId, userId)) {
    return null; // 忽略非發起人的輸入
}
```

### 2.3 數據對接標準
- **模板讀取**：從 `data/robot_map.xlsx` 讀取題目流程
- **結果存儲**：將結果存入 `data/excel_results/`
- **文件命名**：使用毫秒級時間戳命名結果文件

## 3. 代碼實現規範

### 3.1 構造函數標準
```javascript
constructor({ pathManager, securityManager, contextStandardizer }) {
    this.pathManager = pathManager;
    this.securityManager = securityManager;
    this.contextStandardizer = contextStandardizer;
    
    // 使用 PathManager 常量
    this.mapFile = this.pathManager.DATA + '/robot_map.xlsx';
    this.resultsDir = this.pathManager.DATA + '/excel_results/';
}
```

### 3.2 execute 方法標準
```javascript
async execute(context, command) {
    // 1. 權限檢查
    if (!this.securityManager.isWhiteListed(context.userId)) {
        throw new Error('權限不足');
    }
    
    // 2. 跨頻道處理
    await this.contextStandardizer.recordInteraction(context, command);
    
    // 3. 會話鎖定
    if (context.isGroup) {
        this.lockSession(context.originId, context.userId);
    }
    
    // 4. 執行邏輯
    return await this.startForm(context, command);
}
```

### 3.3 群組會話鎖實現
```javascript
lockSession(originId, initiatorId) {
    this.groupSessions.set(originId, {
        initiatorId: initiatorId,
        currentStep: 'start',
        data: new Map()
    });
}

isGroupSessionLocked(originId, userId) {
    const session = this.groupSessions.get(originId);
    return session && session.initiatorId !== userId;
}
```

## 4. 測試驗證標準

### 4.1 群組環境測試
- **場景1**：群組內多人同時輸入，驗證是否只識別發起人
- **場景2**：非發起人輸入，驗證是否被正確過濾
- **場景3**：發起人輸入，驗證是否正常處理

### 4.2 反饋機制測試
- **確認回覆**：驗證 `@pushname 收到: [內容]` 是否正確顯示
- **問題流程**：驗證問題是否按順序正確顯示
- **取消功能**：驗證 `!cancel` 是否立即終止會話

### 4.3 數據完整性測試
- **模板讀取**：驗證 Excel 模板是否正確讀取
- **結果存儲**：驗證結果文件是否正確生成
- **會話清理**：驗證會話結束後狀態是否完全清理

## 5. 錯誤處理規範

### 5.1 權限錯誤
- **處理方式**：立即拒絕並提示權限不足
- **日誌記錄**：記錄安全日誌

### 5.2 模板錯誤
- **處理方式**：自動創建默認模板
- **錯誤提示**：提示用戶模板已自動創建

### 5.3 會話錯誤
- **處理方式**：清理會話狀態並重新開始
- **錯誤提示**：提示會話異常，請重新開始

---

**版本**: v1.0
**最後更新**: 2026年4月10日
**適用範圍**: PBOTS Phase 7 LogicEngine 重構