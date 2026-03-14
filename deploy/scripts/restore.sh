#!/bin/bash
# ============================================
# 武当内容创作系统 v3.0 - 数据恢复脚本
# ============================================

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
BACKUP_DIR="${PROJECT_DIR}/data/backups"

# 显示帮助
show_help() {
    echo "用法: $0 <备份文件前缀>"
    echo ""
    echo "示例:"
    echo "  $0 wudang-cms-backup-20260314_120000"
    echo ""
    echo "可用备份:"
    ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | xargs -n1 basename | sed 's/.sql.gz//' | sed 's/^/  - /' || echo "  (无备份文件)"
}

# 检查参数
if [ -z "$1" ] || [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_help
    exit 0
fi

BACKUP_PREFIX="$1"
BACKUP_SQL="${BACKUP_DIR}/${BACKUP_PREFIX}.sql.gz"
BACKUP_REDIS="${BACKUP_DIR}/${BACKUP_PREFIX}-redis.tar.gz"
BACKUP_MINIO="${BACKUP_DIR}/${BACKUP_PREFIX}-minio.tar.gz"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  数据恢复${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 确认恢复
echo -e "${RED}警告: 恢复操作将覆盖现有数据！${NC}"
echo -e "备份文件: ${BACKUP_PREFIX}"
echo ""
read -p "确认恢复? (输入 yes 继续): " confirm
if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 0
fi

cd "$PROJECT_DIR"

# 1. 恢复数据库
echo -e "${YELLOW}[1/3] 恢复 PostgreSQL 数据库...${NC}"
if [ -f "$BACKUP_SQL" ]; then
    docker-compose stop api worker
    gunzip < "$BACKUP_SQL" | docker-compose exec -T postgres psql -U wudang
    docker-compose start api worker
    echo -e "${GREEN}✓ 数据库恢复完成${NC}"
else
    echo -e "${RED}✗ 数据库备份文件不存在: $BACKUP_SQL${NC}"
fi

# 2. 恢复 Redis
echo -e "${YELLOW}[2/3] 恢复 Redis 数据...${NC}"
if [ -f "$BACKUP_REDIS" ]; then
    docker-compose stop worker
    rm -rf data/redis/*
    tar xzf "$BACKUP_REDIS" -C data/redis
    docker-compose start worker
    echo -e "${GREEN}✓ Redis恢复完成${NC}"
else
    echo -e "${YELLOW}⚠ Redis备份文件不存在，跳过${NC}"
fi

# 3. 恢复 MinIO
echo -e "${YELLOW}[3/3] 恢复 MinIO 数据...${NC}"
if [ -f "$BACKUP_MINIO" ]; then
    docker-compose stop api worker
    rm -rf data/minio/*
    tar xzf "$BACKUP_MINIO" -C data/minio
    docker-compose start api worker
    echo -e "${GREEN}✓ MinIO恢复完成${NC}"
else
    echo -e "${YELLOW}⚠ MinIO备份文件不存在，跳过${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  恢复完成！${NC}"
echo -e "${GREEN}========================================${NC}"
