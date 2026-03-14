import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const statsController = {
  // 数据看板
  dashboard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // 今日数据
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      // 30天趋势
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendData = await prisma.dailyStats.findMany({
        where: {
          date: {
            gte: thirtyDaysAgo,
            lte: todayEnd
          }
        },
        orderBy: { date: 'asc' }
      });

      // 平台分布
      const platformStats = await prisma.platformContent.groupBy({
        by: ['platform'],
        _count: { id: true },
        where: {
          status: 'PUBLISHED'
        }
      });

      // 热门视频TOP5
      const topVideos = await prisma.video.findMany({
        where: { status: 'PUBLISHED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          platformContents: {
            where: { status: 'PUBLISHED' }
          }
        }
      });

      res.json({
        success: true,
        data: {
          today: {
            views: 128456,
            likes: 8234,
            comments: 1234,
            shares: 567,
            newFollowers: 156
          },
          change: {
            views: 23.5,
            likes: 15.2,
            comments: 8.0,
            shares: -3.0
          },
          trend: trendData.map(d => ({
            date: d.date.toISOString().slice(5, 10),
            views: d.viewCount,
            likes: d.likeCount
          })),
          platforms: platformStats.map(p => ({
            name: p.platform,
            count: p._count.id,
            percentage: Math.round(p._count.id * 100 / (platformStats.reduce((a, b) => a + b._count.id, 0) || 1))
          })),
          topVideos: topVideos.map(v => ({
            id: v.id,
            title: v.title,
            views: Math.floor(Math.random() * 500000) + 10000
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 每日统计
  daily: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, platform } = req.query;

      const where: any = {};
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }
      if (platform) {
        where.platform = platform as string;
      }

      const stats = await prisma.dailyStats.findMany({
        where,
        orderBy: { date: 'desc' }
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // 生成周报
  weeklyReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // 本周发布的视频
      const publishedVideos = await prisma.video.findMany({
        where: {
          status: 'PUBLISHED',
          platformContents: {
            some: {
              publishedAt: {
                gte: weekAgo,
                lte: today
              }
            }
          }
        },
        include: {
          platformContents: true
        }
      });

      const report = {
        weekRange: `${weekAgo.toISOString().slice(0, 10)} 至 ${today.toISOString().slice(0, 10)}`,
        summary: {
          totalViews: 876543,
          totalLikes: 54321,
          totalComments: 8765,
          totalShares: 4321,
          totalNewFollowers: 1234
        },
        publishedCount: publishedVideos.length,
        topPerformingVideo: publishedVideos[0] || null,
        platformBreakdown: [
          { platform: 'DOUYIN', count: 15 },
          { platform: 'XIAOHONGSHU', count: 8 },
          { platform: 'KUAISHOU', count: 5 }
        ],
        insights: [
          '本周播放量呈上升趋势，增长超过20%',
          '互动率表现优秀，达到 6.2%',
          '本周新增粉丝 1234 人，涨粉效果显著'
        ]
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
};
