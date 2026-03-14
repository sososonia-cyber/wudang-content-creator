import Queue from 'bull';
import Redis from 'ioredis';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { processVideoGeneration } from './handlers/videoGeneration';

// Redis 连接
export const redis = new Redis(config.redisUrl);

// 视频生成队列
export let videoGenerationQueue: Queue.Queue;

// 初始化所有队列
export const initQueues = async () => {
  logger.info('🔄 初始化任务队列...');

  // 视频生成队列
  videoGenerationQueue = new Queue('video-generation', config.redisUrl, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });

  // 注册处理器
  videoGenerationQueue.process('generate-video', processVideoGeneration);

  // 事件监听
  videoGenerationQueue.on('completed', (job) => {
    logger.info(`✅ 任务完成: ${job.id}`);
  });

  videoGenerationQueue.on('failed', (job, err) => {
    logger.error(`❌ 任务失败: ${job.id}, 错误: ${err.message}`);
  });

  logger.info('✅ 任务队列初始化完成');
};

// 优雅关闭
export const closeQueues = async () => {
  await videoGenerationQueue.close();
  await redis.quit();
  logger.info('👋 任务队列已关闭');
};
