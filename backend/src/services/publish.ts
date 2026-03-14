import { prisma } from '../config/database';
import { redis } from '../jobs/queues';
import { logger } from '../utils/logger';

interface PublishJob {
  contentId: string;
  platform: string;
  scheduledAt: Date;
}

interface PublishResult {
  success: boolean;
  message: string;
  url?: string;
  platformVideoId?: string;
}

export class PublishService {
  private readonly QUEUE_KEY = 'publish:queue';

  // 调度发布任务
  async schedulePublish(job: PublishJob): Promise<void> {
    const timestamp = job.scheduledAt.getTime();
    const jobData = JSON.stringify(job);
    
    // 使用Redis有序集合存储定时任务
    await redis.zadd(this.QUEUE_KEY, timestamp, jobData);
    
    logger.info(`发布任务已调度: ${job.contentId} -> ${job.platform} at ${job.scheduledAt}`);
  }

  // 取消定时发布
  async cancelScheduledPublish(contentId: string): Promise<void> {
    // 获取所有任务
    const jobs = await redis.zrange(this.QUEUE_KEY, 0, -1);
    
    for (const jobData of jobs) {
      const job = JSON.parse(jobData);
      if (job.contentId === contentId) {
        await redis.zrem(this.QUEUE_KEY, jobData);
        logger.info(`发布任务已取消: ${contentId}`);
      }
    }
  }

  // 检查并执行到期的发布任务
  async checkAndExecuteScheduled(): Promise<void> {
    const now = Date.now();
    
    // 获取所有到期的任务
    const jobs = await redis.zrangebyscore(this.QUEUE_KEY, 0, now);
    
    for (const jobData of jobs) {
      const job: PublishJob = JSON.parse(jobData);
      
      try {
        await this.publishToPlatform({
          contentId: job.contentId,
          platform: job.platform
        });
        
        // 从队列中移除
        await redis.zrem(this.QUEUE_KEY, jobData);
      } catch (error) {
        logger.error(`执行发布任务失败: ${job.contentId}`, error);
      }
    }
  }

  // 发布到指定平台
  async publishToPlatform({
    contentId,
    platform
  }: {
    contentId: string;
    platform: string;
  }): Promise<PublishResult> {
    const content = await prisma.platformContent.findUnique({
      where: { id: contentId },
      include: { video: true }
    });

    if (!content) {
      throw new Error('内容不存在');
    }

    // 根据平台调用不同的发布API
    switch (platform) {
      case 'DOUYIN':
        return this.publishToDouyin(content);
      case 'XIAOHONGSHU':
        return this.publishToXiaohongshu(content);
      case 'KUAISHOU':
        return this.publishToKuaishou(content);
      case 'BILIBILI':
        return this.publishToBilibili(content);
      case 'WECHAT_VIDEO':
        return this.publishToWechatVideo(content);
      case 'WEIBO':
        return this.publishToWeibo(content);
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  }

  // 发布到抖音（模拟）
  private async publishToDouyin(content: any): Promise<PublishResult> {
    // TODO: 调用抖音开放平台API
    logger.info(`发布到抖音: ${content.title}`);
    
    // 模拟发布成功
    return {
      success: true,
      message: '发布成功',
      url: `https://www.douyin.com/video/mock-${Date.now()}`,
      platformVideoId: `mock-douyin-${Date.now()}`
    };
  }

  // 发布到小红书（模拟）
  private async publishToXiaohongshu(content: any): Promise<PublishResult> {
    logger.info(`发布到小红书: ${content.title}`);
    
    return {
      success: true,
      message: '发布成功',
      url: `https://www.xiaohongshu.com/explore/mock-${Date.now()}`,
      platformVideoId: `mock-xhs-${Date.now()}`
    };
  }

  // 发布到快手（模拟）
  private async publishToKuaishou(content: any): Promise<PublishResult> {
    logger.info(`发布到快手: ${content.title}`);
    
    return {
      success: true,
      message: '发布成功',
      url: `https://www.kuaishou.com/short-video/mock-${Date.now()}`,
      platformVideoId: `mock-ks-${Date.now()}`
    };
  }

  // 发布到B站（模拟）
  private async publishToBilibili(content: any): Promise<PublishResult> {
    logger.info(`发布到B站: ${content.title}`);
    
    return {
      success: true,
      message: '发布成功',
      url: `https://www.bilibili.com/video/mock-${Date.now()}`,
      platformVideoId: `mock-bili-${Date.now()}`
    };
  }

  // 发布到视频号（模拟）
  private async publishToWechatVideo(content: any): Promise<PublishResult> {
    logger.info(`发布到视频号: ${content.title}`);
    
    return {
      success: true,
      message: '发布成功',
      url: `https://channels.weixin.qq.com/mock-${Date.now()}`,
      platformVideoId: `mock-wx-${Date.now()}`
    };
  }

  // 发布到微博（模拟）
  private async publishToWeibo(content: any): Promise<PublishResult> {
    logger.info(`发布到微博: ${content.title}`);
    
    return {
      success: true,
      message: '发布成功',
      url: `https://weibo.com/mock-${Date.now()}`,
      platformVideoId: `mock-weibo-${Date.now()}`
    };
  }
}

export const publishService = new PublishService();
