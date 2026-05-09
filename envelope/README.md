# 📦 envelope/ - 封裝部署目錄

此目錄包含 PBOTS 機器人的封裝和部署相關文件。

## 📁 部署文件

### Docker 配置

- **Dockerfile**: 容器化部署配置
- **docker-compose.yml**: 多容器編排配置
- **.dockerignore**: Docker 忽略文件列表

### 部署腳本

- **deploy.sh**: Linux 部署腳本
- **deploy.ps1**: Windows 部署腳本
- **install.sh**: 安裝腳本

### 環境配置

- **.env.example**: 環境變數示例
- **production.env**: 生產環境配置
- **development.env**: 開發環境配置

## 🚀 部署方式

### Docker 部署

```bash
# 構建鏡像
docker build -t pbots .

# 運行容器
docker run -d --name pbots pbots
```

### 傳統部署

```bash
# 安裝依賴
npm install

# 啟動服務
npm start
```

## 🔧 部署配置

### 環境變數

```bash
# WhatsApp 配置
WHATSAPP_SESSION_PATH=/app/sessions
WHATSAPP_HEADLESS=true

# 應用配置
PBOTS_CONFIG_PATH=/app/configs
PBOTS_LOG_LEVEL=info
```

### 端口配置

- **應用端口**: 3000 (可配置)
- **監控端口**: 8080 (健康檢查)

## 📊 監控和日誌

### 健康檢查

```bash
# 健康檢查端點
curl http://localhost:8080/health
```

### 日誌收集

- 容器日誌輸出到標準輸出
- 日誌文件自動輪轉
- 支持日誌聚合服務
