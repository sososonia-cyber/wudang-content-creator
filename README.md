# 武当内容创作系统 v3.0

基于原型设计的全栈内容创作平台，支持 AI 视频生成、热点追踪、多平台适配、团队协作等功能。

## 项目更新

- **最新版本**: v3.0.0 (2026-03-14)
- **更新内容**: 完整前后端架构 + 部署方案
- **状态**: Phase 1 开发完成 (约80%)

## 项目结构

```
wudang-content-creator/
├── backend/              # 后端 API 服务 (Node.js + TypeScript + Express)
│   ├── src/
│   │   ├── config/       # 配置文件
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 业务逻辑
│   │   ├── routes/       # 路由
│   │   ├── jobs/         # 任务队列
│   │   └── utils/        # 工具函数
│   ├── prisma/           # 数据库 schema
│   └── package.json
├── frontend/             # 前端应用 (React + TypeScript + Ant Design)
│   └── src/
│       ├── components/   # 组件
│       ├── pages/        # 页面
│       └── stores/       # 状态管理
├── deploy/               # 生产部署包
│   ├── docker-compose.yml
│   ├── scripts/          # 运维脚本
│   └── nginx/            # Nginx配置
├── scripts/              # 原Skill脚本
├── assets/               # 资源文件
└── references/           # 参考资料
```

## 技术栈

- **后端**: Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis
- **前端**: React + TypeScript + Ant Design + Vite
- **存储**: MinIO (对象存储)
- **队列**: Bull (Redis-based)
- **部署**: Docker + Docker Compose

## 快速开始

### 开发环境

```bash
# 启动基础设施 (PostgreSQL, Redis, MinIO)
docker-compose -f docker-compose.dev.yml up -d

# 后端
cd backend
npm install
npx prisma migrate dev
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 生产部署

```bash
cd deploy
./scripts/init.sh
```

## 功能模块

- [x] 工作台首页 (Dashboard)
- [x] 创作中心 (视频创建/生成/管理)
- [x] 热点追踪 (MiroFish 预测)
- [x] 内容日历 (排期管理)
- [x] 任务管理 (团队协作)
- [x] 数据中心 (统计分析)
- [x] 系统设置

## API 文档

开发环境: http://localhost:8080/api/docs

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# 第三方 API 密钥
SEEDANCE_API_KEY=xxx      # 火山引擎视频生成
QVERIS_API_KEY=xxx        # 热点追踪
LLM_API_KEY=xxx           # AI 预测
```

## 开发计划

- **Day 1-2**: 基础架构 + 核心页面 ✅
- **Day 3-4**: 热点追踪 + 平台适配 🔄
- **Day 5-6**: 团队协作 + 数据中心 ⏸️
- **Day 7-8**: 测试优化 + 部署上线 ⏸️

## 许可证

武当山文旅集团内部使用
