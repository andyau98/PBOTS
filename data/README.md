# 💾 data/ - 數據檔案目錄

此目錄包含 PBOTS 機器人的所有數據檔案，包括聊天記錄、圖片和PDF文檔。

## 📁 子目錄結構

### chats/ - 聊天記錄
- **功能**: 存儲聊天記錄和會話數據
- **文件格式**: JSON、TXT 或數據庫文件
- **內容**: 
  - 用戶會話歷史
  - 命令執行記錄
  - 會話狀態信息

### images/ - 圖片檔案
- **功能**: 存儲用戶上傳的圖片和生成圖片
- **文件格式**: JPG、PNG、GIF 等
- **內容**: 
  - 用戶上傳的圖片
  - 機器人生成的圖片（如QR Code）
  - 報告中的圖表圖片

### pdfs/ - PDF文檔
- **功能**: 存儲生成的PDF報告和文檔
- **文件格式**: PDF
- **內容**: 
  - 工地巡查報告
  - 費用報銷單
  - 試用申請表
  - 其他業務文檔

## 🔧 數據管理

### 文件命名規範
- 使用有意義的文件名
- 包含時間戳和用戶標識
- 避免特殊字符和空格

### 示例文件名
```
chats/user_1234567890_20240415.json
images/qr_code_20240415_1430.png
pdfs/inspection_report_20240415.pdf
```

### 數據備份
- 定期備份重要數據
- 使用 `backups/` 目錄存儲備份
- 實現自動備份機制

## 📈 數據結構

### 聊天記錄結構 (JSON)
```json
{
  "userId": "1234567890@c.us",
  "userName": "張師傅",
  "sessionId": "session_20240415_001",
  "startTime": "2024-04-15T10:00:00Z",
  "endTime": "2024-04-15T10:05:00Z",
  "messages": [
    {
      "timestamp": "2024-04-15T10:00:10Z",
      "type": "command",
      "content": "!trial",
      "isFromUser": true
    },
    {
      "timestamp": "2024-04-15T10:00:15Z", 
      "type": "question",
      "content": "請輸入產品名稱?",
      "isFromUser": false
    }
  ]
}
```

### 圖片元數據
```json
{
  "fileName": "inspection_photo_001.jpg",
  "uploadTime": "2024-04-15T10:30:00Z",
  "uploader": "1234567890@c.us",
  "fileSize": 1024576,
  "description": "工地現場照片"
}
```

## 🔒 數據安全

### 隱私保護
- 加密存儲敏感信息
- 匿名化用戶數據
- 遵守數據保護法規

### 訪問控制
- 限制數據文件訪問權限
- 實現用戶數據隔離
- 定期審計數據訪問

### 數據清理
- 定期清理過期數據
- 實現數據保留策略
- 安全刪除敏感數據

## 🛠️ 使用指南

### 讀取數據
```javascript
const fs = require('fs');
const path = require('path');

// 讀取聊天記錄
const chatFile = path.join(__dirname, 'chats/user_1234567890.json');
const chatData = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
```

### 寫入數據
```javascript
// 保存聊天記錄
const newMessage = {
  timestamp: new Date().toISOString(),
  type: "message", 
  content: "Hello World",
  isFromUser: true
};

chatData.messages.push(newMessage);
fs.writeFileSync(chatFile, JSON.stringify(chatData, null, 2));
```

### 文件上傳處理
```javascript
// 處理圖片上傳
if (message.hasMedia) {
  const media = await message.downloadMedia();
  const fileName = `images/${Date.now()}_${message.from}.jpg`;
  fs.writeFileSync(fileName, media.data, 'base64');
}
```