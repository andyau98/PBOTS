---
name: "whitelist-fix"
description: "修復 PBOTS WhatsApp 機械人的 whitelist 密碼驗證問題。Invoke when whitelist password verification fails or user reports !whitelist command issues."
---

# Whitelist 修復技能

這個技能專門用於修復 PBOTS WhatsApp 機械人的 whitelist 密碼驗證問題，特別是 !whitelist 指令的跨頻道交互問題。

## 問題診斷流程

### 1. 檢查問題症狀
- 用戶在群組發送 `!whitelist` 後，機械人私訊要求密碼
- 用戶在私訊回覆密碼 `288365` 後，機械人沒有反應
- 私訊被當作普通訊息處理，沒有觸發密碼驗證

### 2. 檢查現有處理器
- **SecurityManager**: 檢查 `handleWhitelistCommand` 和 `execute` 方法
- **PrivateMessageHandler**: 檢查 `handlePrivateMessageReply` 方法
- **working_bot.js**: 檢查私訊處理邏輯

## 修復方法

### 修復 working_bot.js 中的私訊處理

```javascript
/**
 * 處理普通私訊（非命令）- 使用 PrivateMessageHandler 處理密碼驗證
 */
async function handlePrivateMessage(client, context, contextStandardizer) {
    try {
        console.log(`💬 處理用戶 ${context.pushname} 的普通私訊: "${context.messageBody}"`);
        
        // 使用 PrivateMessageHandler 處理私訊回覆（包括 whitelist 密碼驗證）
        const privateMessageResult = await privateMessageHandler.handlePrivateMessageReply(client, context);
        
        if (privateMessageResult.success && privateMessageResult.message) {
            await context.message.reply(privateMessageResult.message);
            console.log(`✅ 私訊處理成功: ${context.pushname}`);
        } else {
            console.log(`📝 記錄用戶 ${context.pushname} 的普通私訊，不進行回復`);
        }
        
    } catch (error) {
        console.error('❌ 處理普通私訊失敗:', error.message);
    }
}
```

### 正確的 whitelist 處理流程

#### SecurityManager 處理群組觸發
```javascript
// working_bot.js 中的 whitelist 命令處理
case 'whitelist':
    await handleWhitelistCommand(client, context, contextStandardizer);
    break;

async function handleWhitelistCommand(client, context, contextStandardizer) {
    console.log(`🔓 處理白名單認證請求來自 ${context.pushname}`);
    
    // 使用 SecurityManager 標準化 execute 方法
    const whitelistResult = await securityManager.execute(context, 'whitelist');
    
    // 先回覆原始訊息
    await context.message.reply(whitelistResult.message);
    
    if (whitelistResult.requiresPrivateMessage) {
        // 階段6核心：記錄跨頻道交互上下文
        if (context.isGroup && context.groupId) {
            contextStandardizer.recordInteraction(context, 'whitelist');
        }
        
        // 發送私訊（階段6跨頻道功能）
        try {
            if (context.isGroup) {
                // 使用安全發送方法
                await contextStandardizer.safeSendMessage(
                    client, 
                    context.userId, 
                    "請輸入管理員密碼以獲取權限。", 
                    context
                );
                console.log(`✅ 已成功私訊用戶 ${context.pushname} 要求密碼驗證`);
            } else {
                // 如果是私訊，直接回覆
                await context.message.reply("請輸入管理員密碼以獲取權限。");
                console.log(`🔐 已在私訊中要求用戶 ${context.pushname} 進行密碼驗證`);
            }
        } catch (error) {
            console.log(`❌ 發送私訊失敗: ${error.message}`);
        }
    }
}
```

#### PrivateMessageHandler 處理私訊回覆
```javascript
// PrivateMessageHandler 中的密碼驗證邏輯
if (pendingInteraction && pendingInteraction.command === 'whitelist') {
    console.log(`🔐 處理密碼驗證請求來自 ${pushname}`);
    
    // 使用 securityManager 處理密碼驗證
    const passwordResult = await this.securityManager.handlePasswordVerification(
        context.message, 
        messageBody, 
        userId, 
        false, // 私訊不是群組
        null   // 沒有群組名稱
    );
    
    if (passwordResult.success) {
        // 私訊回覆用戶
        const privateReply = "✅ 認證成功。";
        console.log(`✅ 密碼驗證成功: 用戶 ${pushname} 已成為管理員`);
        
        // 檢查是否有跨頻道交互記錄（從群組觸發）
        let groupNotificationSent = false;
        if (pendingInteraction.originId) {
            groupNotificationSent = await this.sendGroupNotification(client, pendingInteraction, pushname, context);
        }
        
        return {
            success: true,
            message: privateReply,
            groupNotificationSent: groupNotificationSent,
            userAuthenticated: true,
            interactionCompleted: true
        };
    }
}
```

## 驗證步驟

### 1. 測試 whitelist 流程
1. 在群組發送 `!whitelist`
2. 檢查機械人是否私訊要求密碼
3. 在私訊回覆 `288365`
4. 檢查是否收到認證成功訊息
5. 檢查群組是否收到通知

### 2. 檢查日誌輸出
- `🔓 處理白名單認證請求來自 [用戶名]`
- `✅ 已成功私訊用戶 [用戶名] 要求密碼驗證`
- `🔐 處理密碼驗證請求來自 [用戶名]`
- `✅ 密碼驗證成功: 用戶 [用戶名] 已成為管理員`
- `📢 已發送群組通知到 [群組名稱]`

## 常見問題解決

### 問題1: 私訊沒有觸發密碼驗證
**原因**: `handlePrivateMessage` 函數沒有調用 PrivateMessageHandler
**解決**: 確保使用 `privateMessageHandler.handlePrivateMessageReply()`

### 問題2: 密碼驗證成功但沒有群組通知
**原因**: `sendGroupNotification` 方法有問題
**解決**: 檢查 `pendingInteraction.originId` 和群組通知邏輯

### 問題3: 跨頻道交互記錄沒有清理
**原因**: `completeInteraction` 沒有被調用
**解決**: 確保在驗證成功後清理交互記錄

## 技能使用時機

- 當用戶報告 `!whitelist` 指令有問題時
- 當密碼驗證流程失敗時
- 當需要診斷跨頻道交互問題時
- 當私訊處理邏輯需要修復時

## 注意事項

- 確保使用現有的 handler，不要重複創建邏輯
- 遵循 PBOTS 標準化架構規範
- 檢查所有依賴模組是否正確初始化
- 驗證跨頻道交互記錄的正確性