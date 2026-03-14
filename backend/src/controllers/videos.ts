import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { videoGenerationQueue } from '../jobs/queues';

// 验证 Schema
const createVideoSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255, '标题过长'),
  description: z.string().optional(),
  theme: z.enum(['LANDSCAPE', 'TAICHI', 'MARTIAL_ARTS', 'CULTURE', 'OTHER']).default('OTHER'),
  versions: z.number().min(1).max(3).default(1)
});

const updateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  theme: z.enum(['LANDSCAPE', 'TAICHI', 'MARTIAL_ARTS', 'CULTURE', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'REVIEWING', 'PUBLISHED']).optional()
});

export const videoController = {
  // 获取视频列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status, 
        theme,
        search 
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};
      if (status) where.status = status;
      if (theme) where.theme = theme;
      if (search) {
        where.title = {
          contains: search as string,
          mode: 'insensitive'
        };
      }

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            platformContents: true,
            _count: {
              select: { platformContents: true }
            }
          }
        }),
        prisma.video.count({ where })
      ]);

      res.json({
        success: true,
        data: videos,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取单个视频
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const video = await prisma.video.findUnique({
        where: { id },
        include: {
          platformContents: true,
          tasks: true
        }
      });

      if (!video) {
        throw new AppError('视频不存在', 404);
      }

      res.json({
        success: true,
        data: video
      });
    } catch (error) {
      next(error);
    }
  },

  // 创建视频
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createVideoSchema.parse(req.body);
      
      const video = await prisma.video.create({
        data: validatedData
      });

      res.status(201).json({
        success: true,
        message: '视频创建成功',
        data: video
      });
    } catch (error) {
      next(error);
    }
  },

  // 更新视频
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = updateVideoSchema.parse(req.body);

      const video = await prisma.video.update({
        where: { id },
        data: validatedData
      });

      res.json({
        success: true,
        message: '视频更新成功',
        data: video
      });
    } catch (error) {
      next(error);
    }
  },

  // 删除视频
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.video.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: '视频删除成功'
      });
    } catch (error) {
      next(error);
    }
  },

  // 生成视频
  generate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const video = await prisma.video.findUnique({
        where: { id }
      });

      if (!video) {
        throw new AppError('视频不存在', 404);
      }

      // 添加到生成队列
      const job = await videoGenerationQueue.add('generate-video', {
        videoId: id,
        title: video.title,
        theme: video.theme,
        versions: video.versions
      });

      // 更新视频状态
      await prisma.video.update({
        where: { id },
        data: { status: 'GENERATING' }
      });

      res.json({
        success: true,
        message: '视频生成任务已提交',
        data: {
          jobId: job.id,
          videoId: id,
          status: 'PENDING'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取生成状态
  getGenerationStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const job = await prisma.videoGenerationJob.findFirst({
        where: { videoId: id },
        orderBy: { createdAt: 'desc' }
      });

      if (!job) {
        throw new AppError('未找到生成任务', 404);
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 平台适配
  adaptToPlatforms: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { platforms = ['DOUYIN', 'XIAOHONGSHU', 'KUAISHOU', 'BILIBILI'] } = req.body;

      const video = await prisma.video.findUnique({
        where: { id }
      });

      if (!video) {
        throw new AppError('视频不存在', 404);
      }

      // 为每个平台创建适配内容
      const platformContents = await Promise.all(
        platforms.map(async (platform: string) => {
          // 根据平台生成适配内容
          const adapted = generatePlatformAdaptation(video, platform);
          
          return prisma.platformContent.create({
            data: {
              videoId: id,
              platform: platform as any,
              ...adapted
            }
          });
        })
      );

      res.json({
        success: true,
        message: '平台适配完成',
        data: platformContents
      });
    } catch (error) {
      next(error);
    }
  }
};

// 生成平台适配内容
function generatePlatformAdaptation(video: any, platform: string) {
  const adaptations: Record<string, any> = {
    DOUYIN: {
      title: `${video.title} | 武当山`,
      description: `${video.description || ''}\n\n#武当山 #武当 #道教文化`,
      tags: ['武当山', '武当', '道教', '传统文化', '旅游']
    },
    XIAOHONGSHU: {
      title: `被问爆的${video.title}🔥`,
      description: `${video.description || ''}\n\n姐妹们！真的太绝了！\n📍 武当山\n📸 拍照打卡圣地`,
      tags: ['武当山', '小众旅行地', '治愈系风景', '周末去哪儿']
    },
    KUAISHOU: {
      title: `${video.title} - 老铁们看这景色！`,
      description: `${video.description || ''}\n\n双击关注，带你看更多武当美景！`,
      tags: ['武当山', '风景', '旅游', '打卡']
    },
    BILIBILI: {
      title: `【4K】${video.title} | 武当山全记录`,
      description: `${video.description || ''}\n\n拍摄设备：DJI Mavic 3\n后期：DaVinci Resolve\n\n如果你喜欢这个视频，请一键三连支持！`,
      tags: ['武当山', '4K', '风景', '旅行', 'vlog']
    }
  };

  return adaptations[platform] || adaptations.DOUYIN;
}
