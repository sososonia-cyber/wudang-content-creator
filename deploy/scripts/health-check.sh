#!/bin/bash
# ============================================
# 武当内容创作系统 v3.0 - 健康检查脚本
# ============================================

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$PROJECT_DIR"

ERRORS=0

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  系统健康检查${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查容器运行状态
echo -e "${YELLOW}[1/6] 检查容器状态...${NC}"
SERVICES=("postgres" "redis" "minio" "api" "nginx")
for service in "${SERVICES[@]}"; do
    if docker-compose ps "$service" | grep -q "Up"; then
        echo -e "  ${GREEN}✓${NC} $service 运行中"
    else
        echo -e "  ${RED}✗${NC} $service 未运行"
        ((ERRORS++))
    fi
done
echo ""

# 检查端口监听
echo -e "${YELLOW}[2/6] 检查端口监听...${NC}"
PORTS=("80" "5432" "6379" "9000")
for port in "${PORTS[@]}"; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port " || ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "  ${GREEN}✓${NC} 端口 $port 已监听"
    else
        echo -e "  ${YELLOW}⚠${NC} 端口 $port 未监听 (可能仅容器内访问)"
    fi
done
echo ""

# 检查 API 健康
echo -e "${YELLOW}[3/6] 检查 API 服务...${NC}"
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API 健康检查通过"
else
    echo -e "  ${RED}✗${NC} API 健康检查失败"
    ((ERRORS++))
fi
echo ""

# 检查数据库连接
echo -e "${YELLOW}[4/6] 检查数据库连接...${NC}"
if docker-compose exec -T postgres pg_isready -U wudang > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL 连接正常"
else
    echo -e "  ${RED}✗${NC} PostgreSQL 连接失败"
    ((ERRORS++))
fi

if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Redis 连接正常"
else
    echo -e "  ${RED}✗${NC} Redis 连接失败"
    ((ERRORS++))
fi
echo ""

# 检查磁盘空间
echo -e "${YELLOW}[5/6] 检查磁盘空间...${NC}"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "  ${GREEN}✓${NC} 磁盘使用率: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "  ${YELLOW}⚠${NC} 磁盘使用率: ${DISK_USAGE}% (建议清理)"
else
    echo -e "  ${RED}✗${NC} 磁盘使用率: ${DISK_USAGE}% (严重不足)"
    ((ERRORS++))
fi
echo ""

# 检查内存使用
echo -e "${YELLOW}[6/6] 检查内存使用...${NC}"
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEM_USAGE" -lt 80 ]; then
    echo -e "  ${GREEN}✓${NC} 内存使用率: ${MEM_USAGE}%"
elif [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "  ${YELLOW}⚠${NC} 内存使用率: ${MEM_USAGE}% (接近上限)"
else
    echo -e "  ${RED}✗${NC} 内存使用率: ${MEM_USAGE}% (严重不足)"
    ((ERRORS++))
fi
echo ""

# 总结
echo -e "${GREEN}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  所有检查通过！系统运行正常${NC}"
else
    echo -e "${RED}  发现 $ERRORS 个问题，请检查日志${NC}"
    echo -e "  查看日志: docker-compose logs -f"
fi
echo -e "${GREEN}========================================${NC}"

exit $ERRORS
