#!/bin/bash
# ============================================
# 武当内容创作系统 v3.0 - 更新脚本
# ============================================

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  武当内容创作系统更新${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd "$PROJECT_DIR"

# 检查更新参数
UPDATE_TYPE=${1:-"all"}

case $UPDATE_TYPE in
    "images")
        echo -e "${YELLOW}[1/3] 仅更新 Docker 镜像...${NC}"
        docker-compose pull
        echo -e "${GREEN}✓ 镜像更新完成${NC}"
        ;;
    "config")
        echo -e "${YELLOW}[1/3] 仅重载配置...${NC}"
        docker-compose restart nginx
        echo -e "${GREEN}✓ 配置重载完成${NC}"
        ;;
    "all"|*)
        echo -e "${YELLOW}[1/4] 创建更新前备份...${NC}"
        ./scripts/backup.sh
        
        echo -e "${YELLOW}[2/4] 拉取最新镜像...${NC}"
        docker-compose pull
        echo -e "${GREEN}✓ 镜像更新完成${NC}"
        
        echo -e "${YELLOW}[3/4] 重启服务...${NC}"
        docker-compose down
        docker-compose up -d
        echo -e "${GREEN}✓ 服务重启完成${NC}"
        
        echo -e "${YELLOW}[4/4] 清理旧镜像...${NC}"
        docker image prune -f
        echo -e "${GREEN}✓ 旧镜像清理完成${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  更新完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "查看服务状态: ${YELLOW}docker-compose ps${NC}"
echo -e "查看运行日志: ${YELLOW}docker-compose logs -f${NC}"
echo ""
