---
name: "hk-timezone-standard"
description: "確保所有應用程式對齊香港時區 (UTC+8)。Invoke when developing applications for Hong Kong users or when timezone alignment is required."
---

# 🕐 香港時區對齊標準

## 🎯 概述

此 Skill 確保所有為香港用戶開發的應用程式都正確對齊香港時區 (UTC+8)，包括時間戳、日期分類、文件名等所有時間相關功能。

## 📋 核心規範

### 1. 時間處理原則
- **所有時間戳必須使用香港時間 (UTC+8)**
- **禁止使用 UTC 時間或系統默認時區**
- **時間顯示必須符合香港用戶習慣**

### 2. 技術實現標準

#### JavaScript/Node.js 應用
```javascript
// ✅ 正確：使用香港時間
const now = new Date();
const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = hongKongTime.toISOString();

// ❌ 錯誤：使用 UTC 時間
const timestamp = new Date().toISOString(); // UTC 時間
```

#### 文件名時間戳
```javascript
// ✅ 正確：文件名包含香港時間
const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = hongKongTime.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .slice(0, 21); // YYYYMMDD_HHmmss_SSS

// 示例：20260410_234924_058Z_8270_阿A_file.jpg
```

#### 日期分類
```javascript
// ✅ 正確：按香港日期分類文件
const hongKongTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const dateString = hongKongTime.toISOString().split('T')[0]; // "2026-04-10"
const filename = `${dateString}.json`;
```

### 3. 記錄和日誌標準

#### 聊天記錄
```json
{
  "timestamp": "2026-04-10T23:45:19.224Z",  // 香港時間 (UTC+8)
  "sender": "user@whatsapp",
  "content": "訊息內容"
}
```

#### 媒體文件記錄
- **文件名必須包含香港時間戳**
- **文件日期分類必須按香港日期**
- **時間顯示必須清晰標識香港時間**

## 🔧 實施指南

### 1. 新項目初始化
當創建新項目時，必須：
1. **確認目標用戶為香港地區**
2. **在項目文檔中明確時區要求**
3. **在代碼模板中預置香港時區處理**

### 2. 現有項目遷移
當修改現有項目時，必須：
1. **檢查所有時間相關功能**
2. **更新時間處理邏輯**
3. **遷移歷史數據的時間標記**

### 3. 測試驗證
必須驗證：
1. **時間戳顯示正確的香港時間**
2. **文件按香港日期正確分類**
3. **跨日期邊界處理正確**

## 📊 技術細節

### 香港時區計算
```javascript
// 香港時間 = UTC 時間 + 8小時
const HONG_KONG_OFFSET_MS = 8 * 60 * 60 * 1000; // 28,800,000 毫秒
const hongKongTime = new Date(utcTime.getTime() + HONG_KONG_OFFSET_MS);
```

### 時間格式標準
- **ISO 格式**: `2026-04-10T23:45:19.224Z` (雖然顯示 Z，但實際為香港時間)
- **文件名格式**: `YYYYMMDD_HHmmss_SSS`
- **顯示格式**: 根據用戶界面需求自定義

## 🚨 常見錯誤

### 錯誤1：直接使用 toISOString()
```javascript
// ❌ 錯誤
const timestamp = new Date().toISOString(); // 這是 UTC 時間

// ✅ 正確
const hkTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
const timestamp = hkTime.toISOString();
```

### 錯誤2：忽略時區偏移
```javascript
// ❌ 錯誤：忽略時區差異
const localTime = new Date().toLocaleString(); // 系統本地時間

// ✅ 正確：明確指定香港時區
const hkTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
const displayTime = hkTime.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
```

### 錯誤3：文件名時間錯誤
```javascript
// ❌ 錯誤：使用 UTC 時間文件名
const utcTimestamp = new Date().toISOString().replace(/[-:]/g, '');
// 結果：20260410_154924 (UTC 時間)

// ✅ 正確：使用香港時間文件名
const hkTimestamp = new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString().replace(/[-:]/g, '');
// 結果：20260410_234924 (香港時間)
```

## 📁 文件組織

### 記錄文件結構
```
data/
├── chats/
│   ├── 2026-04-10.json    # 香港日期 4月10日
│   └── 2026-04-11.json    # 香港日期 4月11日
├── images/
│   ├── 20260410_234924_...jpg  # 香港時間 23:49:24
│   └── 20260411_001524_...jpg  # 香港時間 00:15:24
└── ...其他文件
```

## 🔄 維護和更新

### 定期檢查
- **每季度檢查一次時區處理邏輯**
- **確認沒有引入新的 UTC 時間使用**
- **驗證跨時區功能正常**

### 文檔更新
- **所有新功能必須包含時區說明**
- **API 文檔必須明確時區要求**
- **開發指南必須包含時區示例**

---
**最後更新**: 2026年4月10日  
**適用範圍**: 所有為香港用戶開發的應用程式  
**強制性**: 所有新開發必須遵守此標準