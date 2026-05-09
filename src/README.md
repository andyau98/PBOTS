# 📁 src/ - 核心源代碼目錄

此目錄包含 PBOTS 機器人的核心源代碼文件。

## 📄 文件說明

### index.js

- **主要功能**: 機器人的主入口文件
- **實現功能**:
    - WhatsApp 客戶端初始化
    - QR Code 登入處理
    - 消息監聽和命令處理
    - 錯誤處理和日誌記錄

## 🔧 核心組件

### 客戶端配置

```javascript
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'pbots-client',
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});
```

### 事件處理

- `qr`: QR Code 生成事件
- `ready`: 客戶端準備就緒事件
- `message`: 消息接收事件
- `auth_failure`: 認證失敗事件
- `disconnected`: 連接中斷事件

### 命令處理

目前支持的基礎命令：

- `!ping` - 測試響應
- `!help` - 幫助訊息
- `!status` - 狀態顯示

## 📈 擴展指南

### 添加新命令

1. 在 `message` 事件處理器中添加新的 `case`
2. 實現命令邏輯
3. 更新配置文件和幫助訊息

### 私信機制實現

私信機制將在後續階段實現，用於處理需要用戶輸入的複雜命令。
