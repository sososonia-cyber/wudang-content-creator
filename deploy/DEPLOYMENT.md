# 武当内容创作系统 v3.0 - 交付清单

## 交付包说明

此部署包包含完整的云服务器托管方案，支持一键部署到任何提供 Docker 环境的云服务器。

---

## 交付文件清单

```
wudang-cms-deploy/
├── README.md                    # 部署说明文档 (必读)
├── docker-compose.yml           # Docker 编排配置
├── .env.example                 # 环境变量模板
├── scripts/
│   ├── init.sh                  # 初始化部署脚本
│   ├── backup.sh                # 数据备份脚本
│   ├── restore.sh               # 数据恢复脚本
│   ├── update.sh                # 系统更新脚本
│   └── health-check.sh          # 健康检查脚本
├── nginx/
│   ├── nginx.conf               # Nginx 主配置
│   └── conf.d/
│       └── wudang-cms.conf      # 业务站点配置
└── monitoring/
    └── prometheus.yml           # 监控配置
```

---

## 交付流程

### 1. 准备阶段

用户提供：
- [ ] 云服务器 IP 地址
- [ ] SSH 登录凭证 (密钥或密码)
- [ ] 域名 (可选，用于 HTTPS)
- [ ] 第三方 API 密钥
  - [ ] Seedance API 密钥 (视频生成)
  - [ ] Qveris API 密钥 (热点追踪)
  - [ ] LLM API 密钥 (AI预测)

### 2. 部署步骤

```bash
# 1. 登录服务器
ssh root@your-server-ip

# 2. 创建部署目录
mkdir -p /opt && cd /opt

# 3. 上传部署包 (方式1: 直接上传)
scp -r wudang-cms-deploy root@your-server-ip:/opt/

# 或 (方式2: 从 git 拉取)
git clone your-repo-url /opt/wudang-cms-deploy

# 4. 进入目录并配置
cd /opt/wudang-cms-deploy
cp .env.example .env
nano .env  # 编辑配置

# 5. 执行部署
./scripts/init.sh

# 6. 验证部署
./scripts/health-check.sh
```

### 3. 配置项说明

#### 必填项
| 配置项 | 获取方式 | 用途 |
|--------|---------|------|
| `DB_PASSWORD` | 自行设置 | 数据库密码 |
| `MINIO_ROOT_PASSWORD` | 自行设置 | 对象存储密码 |
| `JWT_SECRET` | 自行设置 | 应用安全密钥 |
| `SEEDANCE_API_KEY` | 火山引擎控制台 | AI视频生成 |
| `QVERIS_API_KEY` | Qveris官网 | 热点数据获取 |
| `LLM_API_KEY` | 阿里百炼/其他 | AI预测分析 |

#### 可选配置
| 配置项 | 默认值 | 说明 |
|--------|-------|------|
| `LOG_LEVEL` | info | 日志详细程度 |
| `GRAFANA_ADMIN_PASSWORD` | admin | 监控面板密码 |
| `DOMAIN` | - | 域名 (用于SSL) |

---

## 服务架构

```
┌──────────────────────────────────────────────────────┐
│                    云服务器                            │
├──────────────────────────────────────────────────────┤
│  Nginx (80/443)                                      │
│    ├── Web 前端 (React)                              │
│    ├── API 服务 (Node.js)                            │
│    └── MinIO 控制台 (:9001)                          │
├──────────────────────────────────────────────────────┤
│  数据层                                               │
│    ├── PostgreSQL 15 (数据库)                         │
│    ├── Redis 7 (缓存/队列)                            │
│    └── MinIO (对象存储)                               │
├──────────────────────────────────────────────────────┤
│  可选监控                                             │
│    ├── Prometheus (指标采集)                          │
│    └── Grafana (可视化)                               │
└──────────────────────────────────────────────────────┘
```

---

## 运维命令速查

| 操作 | 命令 |
|------|------|
| 查看状态 | `docker-compose ps` |
| 查看日志 | `docker-compose logs -f` |
| 重启服务 | `docker-compose restart` |
| 停止服务 | `docker-compose down` |
| 备份数据 | `./scripts/backup.sh` |
| 恢复数据 | `./scripts/restore.sh <备份名>` |
| 更新系统 | `./scripts/update.sh` |
| 健康检查 | `./scripts/health-check.sh` |

---

## 目录映射

| 宿主机路径 | 容器路径 | 用途 |
|-----------|---------|------|
| `./data/postgres` | `/var/lib/postgresql/data` | 数据库持久化 |
| `./data/redis` | `/data` | 缓存持久化 |
| `./data/minio` | `/data` | 对象存储数据 |
| `./data/logs` | `/app/logs` | 应用日志 |
| `./data/backups` | - | 备份文件 |
| `./nginx/ssl` | `/etc/nginx/ssl` | SSL证书 |

---

## 安全建议

### 1. 防火墙配置
```bash
# 开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 关闭敏感端口
ufw deny 5432/tcp   # PostgreSQL
ufw deny 6379/tcp   # Redis
ufw deny 9001/tcp   # MinIO (如需外网访问则开放)
```

### 2. 定期备份
```bash
# 添加定时任务
crontab -e

# 每天凌晨2点自动备份
0 2 * * * /opt/wudang-cms-deploy/scripts/backup.sh

# 每周日凌晨3点发送健康报告
0 3 * * 0 /opt/wudang-cms-deploy/scripts/health-check.sh
```

### 3. 日志清理
```bash
# 定期清理旧日志 (保留30天)
find /opt/wudang-cms-deploy/data/logs -name "*.log" -mtime +30 -delete
```

---

## 故障处理

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| 端口被占用 | 修改 docker-compose.yml 端口映射 |
| 内存不足 | 增加服务器内存或减少 worker 数量 |
| 磁盘满了 | 清理日志或扩容磁盘 |
| 服务无法启动 | 查看日志 `docker-compose logs` |

### 紧急回滚
```bash
# 1. 停止服务
docker-compose down

# 2. 恢复数据
./scripts/restore.sh wudang-cms-backup-YYYYMMDD_HHMMSS

# 3. 重新启动
docker-compose up -d
```

---

## 更新升级

### 平滑升级流程
```bash
# 1. 备份当前数据
./scripts/backup.sh

# 2. 拉取新版本镜像
docker-compose pull

# 3. 滚动更新 (先更新 worker)
docker-compose up -d --no-deps worker
docker-compose up -d --no-deps api
docker-compose up -d --no-deps web

# 4. 验证服务
./scripts/health-check.sh
```

---

## 技术支持

部署完成后，系统将运行在：
- 前端: http://your-server-ip
- API: http://your-server-ip/api
- MinIO控制台: http://your-server-ip:9001

---

**交付日期**: 2026-03-14  
**版本**: v3.0.0  
**状态**: 待用户确认服务器信息后部署
