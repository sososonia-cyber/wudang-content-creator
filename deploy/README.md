# 武当内容创作系统 v3.0 - 云服务器部署包

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [配置说明](#配置说明)
- [常用操作](#常用操作)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 系统要求

### 服务器配置

| 环境 | CPU | 内存 | 磁盘 | 带宽 |
|------|-----|------|------|------|
| 开发测试 | 4核 | 8G | 100G SSD | 5M |
| 生产环境 | 8核 | 16G | 200G SSD | 10M |

### 软件依赖

- Docker 20.10+
- Docker Compose 2.0+
- Linux 操作系统 (Ubuntu 20.04+ / CentOS 7+)

---

## 快速开始

### 1. 准备服务器

确保你的云服务器已安装 Docker 和 Docker Compose：

```bash
# 安装 Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 上传部署包

将 `wudang-cms-deploy` 目录上传到服务器：

```bash
# 使用 scp 上传
scp -r wudang-cms-deploy root@your-server-ip:/opt/

# 或者使用 git 克隆
git clone your-repo-url /opt/wudang-cms-deploy
```

### 3. 配置环境变量

```bash
cd /opt/wudang-cms-deploy

# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

**必须修改的配置项：**

```bash
# 数据库密码 (必须修改)
DB_PASSWORD=YourStrongPassword123!

# MinIO 密码 (必须修改)
MINIO_ROOT_PASSWORD=YourMinioPassword456!

# JWT 密钥 (必须修改，建议随机生成)
JWT_SECRET=$(openssl rand -base64 32)

# 第三方 API 密钥
SEEDANCE_API_KEY=your-seedance-api-key      # 火山引擎视频生成
QVERIS_API_KEY=your-qveris-api-key          # 热点追踪
LLM_API_KEY=your-llm-api-key                # AI预测 (阿里百炼)
```

### 4. 执行初始化

```bash
# 进入脚本目录
cd /opt/wudang-cms-deploy

# 执行初始化脚本 (自动完成所有配置)
./scripts/init.sh
```

初始化脚本会自动：
- 检查 Docker 环境
- 创建数据目录
- 拉取 Docker 镜像
- 启动数据库和缓存服务
- 初始化存储桶
- 启动应用服务

### 5. 验证部署

```bash
# 查看服务状态
docker-compose ps

# 测试 API 健康检查
curl http://localhost/health

# 查看日志
docker-compose logs -f
```

### 6. 访问系统

- **前端页面**: http://your-server-ip
- **API 文档**: http://your-server-ip/api/docs
- **MinIO 控制台**: http://your-server-ip:9001

---

## 目录结构

```
wudang-cms-deploy/
├── docker-compose.yml          # 主部署配置
├── .env.example                # 环境变量模板
├── .env                        # 实际环境变量 (保密)
├── README.md                   # 本说明文档
├── scripts/                    # 运维脚本
│   ├── init.sh                 # 初始化部署
│   ├── backup.sh               # 数据备份
│   ├── restore.sh              # 数据恢复
│   ├── update.sh               # 系统更新
│   └── health-check.sh         # 健康检查
├── nginx/                      # Nginx 配置
│   ├── nginx.conf              # 主配置
│   ├── conf.d/                 # 站点配置
│   │   └── wudang-cms.conf     # 业务站点
│   └── ssl/                    # SSL证书
├── data/                       # 数据持久化 (自动创建)
│   ├── postgres/               # 数据库数据
│   ├── redis/                  # 缓存数据
│   ├── minio/                  # 对象存储
│   ├── logs/                   # 应用日志
│   ├── backups/                # 备份文件
│   ├── prometheus/             # 监控数据
│   └── grafana/                # 仪表板数据
└── monitoring/                 # 监控配置
    ├── prometheus.yml          # Prometheus配置
    └── grafana-dashboards/     # Grafana仪表板
```

---

## 配置说明

### 环境变量详解

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DB_PASSWORD` | PostgreSQL 密码 | 必须修改，建议16位以上 |
| `MINIO_ROOT_PASSWORD` | MinIO 密码 | 必须修改 |
| `JWT_SECRET` | JWT 签名密钥 | 必须修改，随机字符串 |
| `SEEDANCE_API_KEY` | 火山引擎 API 密钥 | 视频生成功能必需 |
| `QVERIS_API_KEY` | Qveris API 密钥 | 热点追踪功能必需 |
| `LLM_API_KEY` | 大模型 API 密钥 | MiroFish预测必需 |
| `LOG_LEVEL` | 日志级别 | info/debug/warn/error |

### Nginx 配置

- **HTTP 端口**: 80 (默认)
- **HTTPS 端口**: 443 (需配置 SSL 证书)
- **MinIO 控制台**: 9001

### 数据库配置

- **PostgreSQL**: 5432 (仅本地访问)
- **Redis**: 6379 (仅本地访问)
- **默认数据库**: wudang_cms
- **默认用户**: wundang

---

## 常用操作

### 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f              # 所有服务
docker-compose logs -f api          # 仅 API
docker-compose logs -f worker       # 仅任务队列

# 重启服务
docker-compose restart              # 重启所有
docker-compose restart api          # 仅重启 API

# 停止服务
docker-compose stop                 # 停止 (保留容器)
docker-compose down                 # 停止并删除容器
docker-compose down -v              # 停止并删除容器和数据卷 (危险!)

# 进入容器调试
docker-compose exec api sh          # 进入 API 容器
docker-compose exec postgres psql -U wudang -d wudang_cms  # 进入数据库
```

### 数据备份

```bash
# 执行备份
./scripts/backup.sh

# 备份文件位置
ls -la data/backups/

# 设置定时备份 (每天凌晨2点)
crontab -e
# 添加: 0 2 * * * /opt/wudang-cms-deploy/scripts/backup.sh
```

### 系统更新

```bash
# 完整更新 (备份 + 拉取镜像 + 重启)
./scripts/update.sh

# 仅更新镜像
./scripts/update.sh images

# 仅重载配置
./scripts/update.sh config
```

### SSL 证书配置

```bash
# 方式1: 使用 Let's Encrypt (推荐)
# 安装 certbot
certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# 复制证书到 nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# 取消 nginx/conf.d/wudang-cms.conf 中的 HTTPS 配置注释
# 重启 nginx
docker-compose restart nginx

# 方式2: 使用自定义证书
# 将证书文件放入 nginx/ssl/ 目录
# 修改 nginx/conf.d/wudang-cms.conf 中的证书路径
```

---

## 故障排查

### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep -E '80|443|5432|6379|9000|9001'

# 检查磁盘空间
df -h

# 查看详细日志
docker-compose logs --tail=100
```

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose ps postgres
docker-compose logs postgres

# 手动测试连接
docker-compose exec postgres pg_isready -U wudang
```

### API 无法访问

```bash
# 检查 API 服务
docker-compose ps api
curl http://localhost:8080/health

# 检查 Nginx 配置
docker-compose exec nginx nginx -t
docker-compose logs nginx
```

### 视频生成失败

```bash
# 检查 Worker 状态
docker-compose logs worker

# 检查 API 密钥配置
docker-compose exec api env | grep SEEDANCE
```

---

## 安全建议

### 1. 防火墙配置

```bash
# 开放必要端口
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 22/tcp      # SSH (限制IP)

# 关闭不必要的端口
ufw deny 9001/tcp     # MinIO 控制台 (建议只对内网开放)
ufw deny 5432/tcp     # PostgreSQL
ufw deny 6379/tcp     # Redis

ufw enable
```

### 2. 定期更新

```bash
# 更新系统
apt update && apt upgrade -y

# 更新 Docker 镜像
./scripts/update.sh
```

### 3. 监控告警

- 配置磁盘空间监控 (低于20%告警)
- 配置内存使用监控
- 配置服务可用性监控

---

## 技术支持

如有问题，请检查：
1. 环境变量配置是否正确
2. 服务器资源是否充足
3. Docker 和 Docker Compose 版本是否满足要求
4. 防火墙和安全组配置是否正确

---

*武当内容创作系统 v3.0 - 云服务器部署包 v1.0*
