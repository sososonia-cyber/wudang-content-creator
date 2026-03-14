#!/bin/bash
# ============================================
# 武当内容创作系统 v3.0 - 初始化部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  武当内容创作系统 v3.0 初始化部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查Docker和Docker Compose
echo -e "${YELLOW}[1/8] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker 版本: $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose 版本: $(docker-compose --version)${NC}"

# 创建必要的目录
echo -e "${YELLOW}[2/8] 创建数据目录...${NC}"
mkdir -p "$PROJECT_DIR"/{data/{postgres,redis,minio,logs,backups,prometheus,grafana},nginx/ssl}
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 检查 .env 文件
echo -e "${YELLOW}[3/8] 检查环境变量配置...${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo -e "${YELLOW}⚠ 已创建 .env 文件，请编辑配置后再运行${NC}"
        echo -e "${YELLOW}  需要修改的项:${NC}"
        echo -e "${YELLOW}  - DB_PASSWORD${NC}"
        echo -e "${YELLOW}  - MINIO_ROOT_PASSWORD${NC}"
        echo -e "${YELLOW}  - JWT_SECRET${NC}"
        echo -e "${YELLOW}  - SEEDANCE_API_KEY${NC}"
        echo -e "${YELLOW}  - QVERIS_API_KEY${NC}"
        echo -e "${YELLOW}  - LLM_API_KEY${NC}"
        exit 1
    else
        echo -e "${RED}错误: 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

# 检查必要的环境变量
echo -e "${YELLOW}[4/8] 验证环境变量...${NC}"
source "$PROJECT_DIR/.env"

REQUIRED_VARS=("DB_PASSWORD" "MINIO_ROOT_PASSWORD" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}错误: 以下环境变量未设置:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✓ 环境变量检查通过${NC}"

# 设置目录权限
echo -e "${YELLOW}[5/8] 设置目录权限...${NC}"
chmod 755 "$PROJECT_DIR/data/postgres"
chmod 755 "$PROJECT_DIR/data/redis"
chmod 755 "$PROJECT_DIR/data/minio"
chmod 755 "$PROJECT_DIR/data/logs"
echo -e "${GREEN}✓ 权限设置完成${NC}"

# 拉取镜像
echo -e "${YELLOW}[6/8] 拉取 Docker 镜像...${NC}"
cd "$PROJECT_DIR"
docker-compose pull
echo -e "${GREEN}✓ 镜像拉取完成${NC}"

# 启动基础设施服务
echo -e "${YELLOW}[7/8] 启动基础设施服务...${NC}"
docker-compose up -d postgres redis minio

# 等待数据库就绪
echo -e "${YELLOW}  等待数据库启动...${NC}"
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0

while ! docker-compose exec -T postgres pg_isready -U "${DB_USER:-wudang}" -d "${DB_NAME:-wudang_cms}" > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}错误: 数据库启动超时${NC}"
        exit 1
    fi
    echo -e "${YELLOW}  等待数据库就绪... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

echo -e "${GREEN}✓ 数据库已就绪${NC}"

# 初始化 MinIO bucket
echo -e "${YELLOW}  初始化 MinIO 存储桶...${NC}"
sleep 3

# 创建bucket (使用mc客户端或直接curl)
docker-compose exec -T minio mc alias set local http://localhost:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null 2>&1 || true
docker-compose exec -T minio mc mb local/"${MINIO_BUCKET:-wudang-cms}" > /dev/null 2>&1 || true
docker-compose exec -T minio mc anonymous set download local/"${MINIO_BUCKET:-wudang-cms}" > /dev/null 2>&1 || true

echo -e "${GREEN}✓ MinIO 存储桶初始化完成${NC}"

# 启动应用服务
echo -e "${YELLOW}[8/8] 启动应用服务...${NC}"
docker-compose up -d api worker web nginx

echo -e "${GREEN}✓ 所有服务已启动${NC}"
echo ""

# 显示状态
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "服务访问地址:"
echo -e "  - 前端应用: http://$(hostname -I | awk '{print $1}')"
echo -e "  - API文档:  http://$(hostname -I | awk '{print $1}')/api/docs"
echo -e "  - MinIO控制台: http://$(hostname -I | awk '{print $1}'):9001"
echo ""
echo -e "监控地址 (如启用):"
echo -e "  - Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo -e "  - Grafana: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo -e "常用命令:"
echo -e "  查看日志: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  查看状态: ${YELLOW}docker-compose ps${NC}"
echo -e "  重启服务: ${YELLOW}docker-compose restart${NC}"
echo -e "  停止服务: ${YELLOW}docker-compose down${NC}"
echo ""
echo -e "${YELLOW}首次使用请检查:${NC}"
echo -e "  1. 访问前端页面是否正常"
echo -e "  2. 测试API接口是否可用"
echo -e "  3. 配置第三方API密钥 (.env文件)"
echo ""
