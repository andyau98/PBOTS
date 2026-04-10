---
name: "LLMmark"
description: "快速使用 LLM_TRANSFER_GUIDE.md 建立專案上下文。Invoke when starting new LLM conversations or when context transfer is needed."
---

# LLMmark Skill

這個 Skill 專門用於快速使用 LLM_TRANSFER_GUIDE.md 文件來建立專案上下文，讓新的 LLM 對話能夠快速理解 EngineeringBot 專案的架構和進度。

## 使用時機

在以下情況下使用此 Skill：
- 開始新的 LLM 對話時
- 需要將專案上下文轉移到新的 AI 時
- 需要確保新 AI 理解專案技術架構時

## 快速使用步驟

### 方法一：直接複製貼上
1. 打開 `LLM_TRANSFER_GUIDE.md` 文件
2. 全選複製全部內容
3. 貼上到新的 LLM 對話視窗

### 方法二：Skill 自動化（推薦）
當你啟動此 Skill 時，系統會自動：
1. 讀取 `LLM_TRANSFER_GUIDE.md` 內容
2. 提供完整的專案上下文摘要
3. 準備好讓你可以直接複製使用

## 上下文內容覆蓋

使用此 Skill 後，新的 LLM 將瞬間擁有以下能力：

### 專案理解
- ✅ 知道這是 EngineeringBot WhatsApp 機器人專案
- ✅ 了解目標用戶是香港 Site Supervisor
- ✅ 知道當前處於 Phase 6 標準化架構完成狀態

### 技術架構理解
- ✅ 熟悉標準化 Context 物件結構
- ✅ 理解 userId (contact.id._serialized) 和 originId (message.from) 的定義
- ✅ 掌握 2b 模式邏輯：群組觸發 -> 私訊互動 -> 原群組回報

### 開發進度了解
- ✅ 知道已完成 Phase 6 標準化重構
- ✅ 了解下一步是開發 Site Memo 功能
- ✅ 熟悉現有的工具模組和檔案架構

### 安全規範認知
- ✅ 了解 !whitelist 驗證機制和 288365 密碼邏輯
- ✅ 掌握安全發送機制和跨頻道交互規範

## 預期效果

使用此 Skill 後，新的 LLM 對話將具備：
- 🎯 **快速上下文建立** - 無需重複解釋專案背景
- 🔧 **正確技術實現** - 強制使用標準化 Context 架構
- 💡 **準確開發指導** - 基於當前專案狀態提供建議
- 🛡️ **安全開發保證** - 遵循專案的安全規範

## 文件位置

主要參考文件：`LLM_TRANSFER_GUIDE.md`（位於專案根目錄）

## 更新維護

當專案有重大更新時，記得更新 `LLM_TRANSFER_GUIDE.md` 文件，以確保 Skill 提供的上下文始終是最新的。

---

**使用提示**: 每次開始新的 LLM 對話時，先使用此 Skill 建立上下文，可以大大提高溝通效率和技術準確性。