#!/bin/bash
# 武当内容创作系统 v3.0 - 开发启动脚本

set -e

echo "🚀 启动武当内容创作系统开发环境"
echo "=================================="

# 启动基础设施
echo "📦 启动基础设施 (PostgreSQL, Redis, MinIO)..."
docker-compose -f docker-compose.dev.yml up -d

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 5

# 检查后端
echo "🔧 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "  安装后端依赖..."
    npm install
fi

# 检查前端
echo "🎨 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "  安装前端依赖..."
    npm install
fi

cd ..

echo ""
echo "✅ 开发环境准备完成！"
echo ""
echo "启动命令:"
echo "  后端: cd backend && npm run dev"
echo "  前端: cd frontend && npm run dev"
echo ""
echo "访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8080"
echo "  API文档: http://localhost:8080/api/docs"
echo "  MinIO: http://localhost:9001 (admin/minioadmin)"
echo ""
