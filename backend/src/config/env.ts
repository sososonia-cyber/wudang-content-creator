import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // 基础配置
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // 数据库
  databaseUrl: process.env.DATABASE_URL || 'postgresql://wudang:password@localhost:5432/wudang_cms',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // MinIO / S3
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'wudang-cms',
    useSSL: process.env.MINIO_USE_SSL === 'true'
  },
  
  // 第三方 API 密钥
  apis: {
    seedance: process.env.SEEDANCE_API_KEY || '',
    qveris: process.env.QVERIS_API_KEY || '',
    tikapi: process.env.TIKAPI_KEY || '',
    llm: process.env.LLM_API_KEY || '',
    llmBaseUrl: process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    llmModel: process.env.LLM_MODEL_NAME || 'qwen-plus'
  },
  
  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // 视频生成
  video: {
    maxVersions: parseInt(process.env.VIDEO_MAX_VERSIONS || '3', 10),
    defaultVersions: parseInt(process.env.VIDEO_DEFAULT_VERSIONS || '1', 10),
    maxDuration: parseInt(process.env.VIDEO_MAX_DURATION || '60', 10)
  }
};

// 配置验证
export const validateConfig = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missing.join(', '));
    process.exit(1);
  }
};
