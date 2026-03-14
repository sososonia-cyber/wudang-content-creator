import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { publishService } from '../services/publish';
import { notificationService } from '../services/notification';

const schedulePublishSchema = z.object({
  platformContentId: z.string(),
  scheduledAt: z.string().datetime(),
  platforms: z.array(z.enum(['DOUYIN', 'XIAOHONGSHU', 'KUAISHOU', 'BILIBILI', 'WECHAT_VIDEO', 'WEIBO']))
});

const publishNowSchema = z.object({
  platformContentId: z.string(),
  platforms: z.array(z.enum(['DOUYIN', 'XIAOHONGSHU', 'KUAISHOU', 'BILIBILI', 'WECHAT_VIDEO', 'WEIBO']))
});

export const publishController = {
  // 定时发布
  schedulePublish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { platformContentId, scheduledAt, platforms } = schedulePublishSchema.parse(req.body);

      // 检查内容是否存在
      const content = await prisma.platformContent.findUnique({
        where: { id: platformContentId },
        include: { video: true }
      });

      if (!content) {
        throw new AppError('内容不存在', 404);
      }

      // 更新发布时间和状态
      const updatedContent = await prisma.platformContent.update({
        where: { id: platformContentId },
        data: {
          scheduledAt: new Date(scheduledAt),
          status: 'SCHEDULED'
        }
      });

      // 添加到发布队列
      for (const platform of platforms) {
        await publishService.schedulePublish({
          contentId: platformContentId,
          platform,
          scheduledAt: new Date(scheduledAt)
        });
      }

      res.json({
        success: true,
        message: '定时发布已设置',
        data: {
          contentId: platformContentId,
          scheduledAt,
          platforms,
          status: 'SCHEDULED'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 立即发布
  publishNow: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { platformContentId, platforms } = publishNowSchema.parse(req.body);

      const content = await prisma.platformContent.findUnique({
        where: { id: platformContentId },
        include: { video: true }
      });

      if (!content) {
        throw new AppError('内容不存在', 404);
      }

      const results = [];

      for (const platform of platforms) {
        try {
          const result = await publishService.publishToPlatform({
            contentId: platformContentId,
            platform
          });

          results.push({
            platform,
            status: result.success ? 'success' : 'failed',
            message: result.message,
            url: result.url
          });

          // 发送通知
          await notificationService.sendPublishNotification(
            content.videoId,
            req.user?.id || '',
            platform,
            result.success ? 'success' : 'failed'
          );

        } catch (error: any) {
          results.push({
            platform,
            status: 'failed',
            message: error.message
          });
        }
      }

      // 更新内容状态
      const allSuccess = results.every(r => r.status === 'success');
      await prisma.platformContent.update({
        where: { id: platformContentId },
        data: {
          status: allSuccess ? 'PUBLISHED' : 'FAILED',
          publishedAt: allSuccess ? new Date() : null
        }
      });

      res.json({
        success: true,
        message: '发布完成',
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取发布状态
  getPublishStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const content = await prisma.platformContent.findUnique({
        where: { id },
        include: {
          video: {
            select: { id: true, title: true }
          }
        }
      });

      if (!content) {
        throw new AppError('内容不存在', 404);
      }

      res.json({
        success: true,
        data: {
          id: content.id,
          platform: content.platform,
          status: content.status,
          scheduledAt: content.scheduledAt,
          publishedAt: content.publishedAt,
          platformUrl: content.platformUrl,
          stats: content.stats
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 取消发布
  cancelPublish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const content = await prisma.platformContent.findUnique({
        where: { id }
      });

      if (!content) {
        throw new AppError('内容不存在', 404);
      }

      if (content.status === 'PUBLISHED') {
        throw new AppError('已发布的内容无法取消', 400);
      }

      // 取消定时任务
      await publishService.cancelScheduledPublish(id);

      // 更新状态
      await prisma.platformContent.update({
        where: { id },
        data: {
          status: 'PENDING',
          scheduledAt: null
        }
      });

      res.json({
        success: true,
        message: '发布已取消'
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取发布队列
  getPublishQueue: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status = 'SCHEDULED' } = req.query;

      const queue = await prisma.platformContent.findMany({
        where: {
          status: status as string
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        include: {
          video: {
            select: { id: true, title: true, coverImageUrl: true }
          }
        }
      });

      res.json({
        success: true,
        data: queue
      });
    } catch (error) {
      next(error);
    }
  }
};
