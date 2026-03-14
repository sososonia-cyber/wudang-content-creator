#!/bin/bash
# ============================================
# 武当内容创作系统 v3.0 - 备份脚本
# ============================================

set -e

# 配置
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="wudang-cms-backup-${TIMESTAMP}"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  开始备份 - ${TIMESTAMP}${NC}"
echo -e "${GREEN}========================================${NC}"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 1. 备份数据库
echo -e "${YELLOW}[1/4] 备份 PostgreSQL 数据库...${NC}"
docker-compose exec -T postgres pg_dumpall -c -U wudang > "${BACKUP_DIR}/${BACKUP_NAME}.sql"
gzip "${BACKUP_DIR}/${BACKUP_NAME}.sql"
echo -e "${GREEN}✓ 数据库备份完成: ${BACKUP_NAME}.sql.gz${NC}"

# 2. 备份 Redis
echo -e "${YELLOW}[2/4] 备份 Redis 数据...${NC}"
docker-compose exec -T redis redis-cli BGSAVE > /dev/null 2>&1 || true
sleep 2
tar czf "${BACKUP_DIR}/${BACKUP_NAME}-redis.tar.gz" -C "$(dirname "${BACKUP_DIR}")/redis" .
echo -e "${GREEN}✓ Redis备份完成: ${BACKUP_NAME}-redis.tar.gz${NC}"

# 3. 备份 MinIO 数据
echo -e "${YELLOW}[3/4] 备份 MinIO 对象存储...${NC}"
tar czf "${BACKUP_DIR}/${BACKUP_NAME}-minio.tar.gz" -C "$(dirname "${BACKUP_DIR}")/minio" .
echo -e "${GREEN}✓ MinIO备份完成: ${BACKUP_NAME}-minio.tar.gz${NC}"

# 4. 备份配置文件
echo -e "${YELLOW}[4/4] 备份配置文件...${NC}"
tar czf "${BACKUP_DIR}/${BACKUP_NAME}-config.tar.gz" -C "$(dirname "${BACKUP_DIR}")" \
    .env docker-compose.yml nginx/ monitoring/ 2>/dev/null || true
echo -e "${GREEN}✓ 配置备份完成: ${BACKUP_NAME}-config.tar.gz${NC}"

# 清理旧备份
echo -e "${YELLOW}清理 ${RETENTION_DAYS} 天前的备份...${NC}"
find "${BACKUP_DIR}" -name "wudang-cms-backup-*.gz" -mtime +${RETENTION_DAYS} -delete
echo -e "${GREEN}✓ 旧备份清理完成${NC}"

# 生成备份报告
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  备份完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo "备份文件:"
ls -lh "${BACKUP_DIR}/${BACKUP_NAME}"* | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "备份目录: ${BACKUP_DIR}"
echo ""
