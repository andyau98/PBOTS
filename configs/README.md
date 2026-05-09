# ⚙️ configs/ - 配置檔案目錄

此目錄包含 PBOTS 機器人的所有配置檔案。

## 📄 文件說明

### settings.json

- **主要功能**: 機器人的主要配置檔案
- **配置項目**:
    - 項目基本信息 (名稱、版本、描述)
    - 路徑配置 (各目錄路徑)
    - 機器人設定 (名稱、前綴、功能開關)
    - 日誌設定 (級別、文件、大小限制)
    - 功能開關 (QR登入、會話持久化等)
    - 安全設定 (認證、允許群組、封鎖用戶)
    - 命令配置 (描述、回應內容)

## 🔧 配置結構

### 項目配置

```json
{
    "project": {
        "name": "PBOTS",
        "version": "1.0.0",
        "description": "Engineering WhatsApp Bot"
    }
}
```

### 路徑配置

```json
{
    "paths": {
        "root": "./",
        "src": "./src/",
        "tools": "./tools/"
    }
}
```

### 機器人設定

```json
{
    "bot": {
        "name": "PBOTS",
        "prefix": "!",
        "privateMessaging": true,
        "groupSessionLock": true
    }
}
```

## 🔄 配置載入

### 自動載入

配置文件在 `src/index.js` 啟動時自動載入：

```javascript
const configPath = path.join(__dirname, '../configs/settings.json');
let config = {};

try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error('❌ 載入配置檔案失敗:', error.message);
    // 使用預設值
}
```

### 錯誤處理

- 配置文件不存在時使用預設值
- JSON 解析錯誤時提供詳細錯誤訊息
- 確保系統在配置錯誤時仍能啟動

## 📈 配置管理

### 環境特定配置

未來可支持環境特定配置：

- `settings.dev.json` - 開發環境
- `settings.prod.json` - 生產環境
- `settings.test.json` - 測試環境

### 配置驗證

可添加配置驗證機制：

- 必填字段檢查
- 數據類型驗證
- 值範圍檢查

### 熱重載

可實現配置熱重載功能：

- 文件監聽配置變更
- 動態重新載入配置
- 無需重啟應用

## 🔒 安全注意

### 敏感信息

- 避免在配置文件中存儲敏感信息
- 使用環境變數存儲密碼和API密鑰
- 配置文件不應提交到版本控制

### 權限管理

- 配置文件應設置適當的文件權限
- 生產環境配置文件應限制訪問
- 定期審計配置安全性
