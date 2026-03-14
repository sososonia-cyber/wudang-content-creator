import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// 路由
import videoRoutes from './routes/videos';
import trendRoutes from './routes/trends';
import taskRoutes from './routes/tasks';
import statsRoutes from './routes/stats';
import calendarRoutes from './routes/calendar';
import systemRoutes from './routes/system';

// 任务队列
import { initQueues } from './jobs/queues';
import { initSchedulers } from './jobs/schedulers';

const app = express();

// 中间件
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

// API 文档
if (config.nodeEnv !== 'production') {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    uptime: process.uptime()
  });
});

// API 路由
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/trends', trendRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/system', systemRoutes);

// 错误处理
app.use(errorHandler);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端点不存在'
  });
});

// 启动服务
const startServer = async () => {
  try {
    // 初始化任务队列
    await initQueues();
    
    // 初始化定时任务
    initSchedulers();

    app.listen(config.port, () => {
      console.log(`🚀 武当内容创作系统 API 服务启动成功`);
      console.log(`📡 端口: ${config.port}`);
      console.log(`🌍 环境: ${config.nodeEnv}`);
      console.log(`📚 API文档: http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
