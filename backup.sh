#!/bin/bash
# PBOTS 項目備份腳本

# 項目根目錄
PROJECT_DIR="/Users/andyau/Documents/trae_projects/PBOTS"
BACKUP_DIR="$PROJECT_DIR/backups"

# 創建時間戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查項目目錄是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "項目目錄不存在: $PROJECT_DIR"
    exit 1
fi

# 切換到項目目錄
cd "$PROJECT_DIR" || {
    print_error "無法切換到項目目錄"
    exit 1
}

print_info "🚀 開始備份 PBOTS 項目..."
print_info "項目目錄: $PROJECT_DIR"
print_info "備份名稱: $BACKUP_NAME"

# 創建備份目錄
mkdir -p "$BACKUP_PATH"

# 備份核心文件
print_info "📁 備份核心文件..."

# 備份配置文件
mkdir -p "$BACKUP_PATH/configs"
cp -r configs/* "$BACKUP_PATH/configs/" 2>/dev/null || true

# 備份工具文件
mkdir -p "$BACKUP_PATH/tools"
cp -r tools/* "$BACKUP_PATH/tools/" 2>/dev/null || true

# 備份文檔文件
mkdir -p "$BACKUP_PATH/docs"
cp -r docs/* "$BACKUP_PATH/docs/" 2>/dev/null || true

# 備份技能文件
mkdir -p "$BACKUP_PATH/skills"
cp -r skills/* "$BACKUP_PATH/skills/" 2>/dev/null || true

# 備份 Trae 技能
mkdir -p "$BACKUP_PATH/.trae/skills"
cp -r .trae/skills/* "$BACKUP_PATH/.trae/skills/" 2>/dev/null || true

# 備份根目錄文件
cp -f working_bot.js "$BACKUP_PATH/" 2>/dev/null || true
cp -f package.json "$BACKUP_PATH/" 2>/dev/null || true
cp -f package-lock.json "$BACKUP_PATH/" 2>/dev/null || true
cp -f ecosystem.config.js "$BACKUP_PATH/" 2>/dev/null || true
cp -f init_check.js "$BACKUP_PATH/" 2>/dev/null || true
cp -f README.md "$BACKUP_PATH/" 2>/dev/null || true
cp -f PROJECT_TREE.md "$BACKUP_PATH/" 2>/dev/null || true

# 創建備份信息文件
cat > "$BACKUP_PATH/backup_info.txt" << EOF
PBOTS 項目備份信息
==================
備份時間: $(date)
備份名稱: $BACKUP_NAME
項目版本: $(grep '"version"' package.json | cut -d'"' -f4)

備份內容:
- 配置文件 (configs/)
- 工具文件 (tools/)
- 文檔文件 (docs/)
- 技能文件 (skills/)
- Trae 技能 (.trae/skills/)
- 核心執行文件

總文件數: $(find "$BACKUP_PATH" -type f | wc -l)
總大小: $(du -sh "$BACKUP_PATH" | cut -f1)
EOF

# 計算備份統計
BACKUP_FILE_COUNT=$(find "$BACKUP_PATH" -type f | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)

print_success "備份完成!"
print_info "備份位置: $BACKUP_PATH"
print_info "備份文件數: $BACKUP_FILE_COUNT"
print_info "備份大小: $BACKUP_SIZE"

# 顯示備份內容摘要
echo ""
print_info "📊 備份內容摘要:"
echo "   ├── 配置文件 ($(ls "$BACKUP_PATH/configs" 2>/dev/null | wc -l) 個文件)"
echo "   ├── 工具文件 ($(ls "$BACKUP_PATH/tools" 2>/dev/null | wc -l) 個文件)"
echo "   ├── 文檔文件 ($(ls "$BACKUP_PATH/docs" 2>/dev/null | wc -l) 個文件)"
echo "   ├── 技能文件 ($(ls "$BACKUP_PATH/skills" 2>/dev/null | wc -l) 個文件)"
echo "   ├── Trae 技能 ($(ls "$BACKUP_PATH/.trae/skills" 2>/dev/null | wc -l) 個文件)"
echo "   └── 核心文件 ($(ls "$BACKUP_PATH"/*.js "$BACKUP_PATH"/*.json "$BACKUP_PATH"/*.md 2>/dev/null | wc -l) 個文件)"

# 顯示最新的備份列表
echo ""
print_info "📋 最近的備份:"
ls -lt "$BACKUP_DIR" | head -6 | grep "backup_" | awk '{print "   " $6 " " $7 " " $8 " " $9}'