# 🤖 PBOTS - Engineering WhatsApp Bot

**PBOTS** (Private Bot for Organized Team Sessions) 是一個基於 WhatsApp Web API 的工程專用機器人，專為群組環境設計，採用私信提問機制避免群組干擾。

## 🚀 功能特色

### 🔒 私信機制 (核心功能)
- **群組發起，私信提問**：用戶在群組中發起指令，機器人私下向用戶提問
- **避免群組干擾**：其他用戶不會錯誤回答，保持群組交流自由
- **群組結果發布**：所有問題完成後，在群組中統一發布結果

### 📋 基礎功能
- ✅ QR Code 掃描登入
- ✅ 持久化會話 (免重複掃碼)
- ✅ 基礎命令測試 (`!ping`, `!help`, `!status`)
- ✅ 完整的錯誤處理和日誌系統

## 📁 項目結構

```
PBOTS/
├── src/                    # 核心源代碼
│   └── index.js           # 主入口文件
├── tools/                  # 輔助工具
├── skills/                 # 技能模組
├── configs/               # 配置檔案
│   └── settings.json      # 主要配置
├── logs/                  # 日誌檔案
├── data/                  # 數據檔案
│   ├── chats/             # 聊天記錄
│   ├── images/            # 圖片檔案
│   └── pdfs/              # PDF文檔
├── backups/               # 備份檔案
└── envelope/              # 封裝部署
```

## 🛠️ 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動機器人
```bash
npm start
# 或
node src/index.js
```

### 3. 掃描 QR Code
- 在終端機中會顯示 QR Code
- 使用 WhatsApp 掃描登入
- 成功後機器人會自動開始監聽訊息

## 📱 使用方式

### 基礎命令
- `!ping` - 測試機器人響應 (回覆: pong)
- `!help` - 顯示幫助訊息
- `!status` - 顯示機器人狀態

### 私信機制流程
1. **群組發起**：在群組中輸入 `!trial` (或其他需要輸入的指令)
2. **私信提問**：機器人私下向您發送第一個問題
3. **私信回答**：在私信中回答問題，機器人會確認收到
4. **群組結果**：所有問題完成後，機器人在群組中發布最終結果

## ⚙️ 配置設定

編輯 `configs/settings.json` 自定義機器人行為：

```json
{
  "bot": {
    "name": "PBOTS",
    "prefix": "!",
    "privateMessaging": true,
    "groupSessionLock": true
  },
  "features": {
    "qrLogin": true,
    "sessionPersistence": true
  }
}
```

## 🔧 技術架構

- **WhatsApp Web API**: 使用 whatsapp-web.js 庫
- **持久化會話**: LocalAuth 實現免重複掃碼
- **模組化設計**: 遵循標準化目錄結構
- **錯誤處理**: 完整的異常處理機制

## 📈 開發計劃

### Phase 1 ✅ - 基礎骨架與 QR 登入
- [x] 標準目錄結構建立
- [x] 環境與依賴初始化
- [x] 獨立參數配置
- [x] 核心入口文件

### Phase 2 🔄 - 消息處理系統
- [ ] 實現消息分類和路由
- [ ] 添加更多實用命令
- [ ] 支持文件上傳和下載

### Phase 3 📋 - Excel 集成
- [ ] 實現 Excel 填表功能
- [ ] 私信提問機制完整實現
- [ ] 群組結果發布功能

## 🐛 故障排除

### 常見問題
1. **QR Code 無法掃描**：確保網絡連接正常，重新啟動機器人
2. **消息無回應**：檢查命令前綴是否正確 (預設為 `!`)
3. **權限問題**：確保有足夠權限訪問所需文件

### 日誌文件
日誌保存在 `logs/pbots.log`，可用於排查問題。

## 📄 許可證

MIT License - 詳見 LICENSE 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改進 PBOTS！