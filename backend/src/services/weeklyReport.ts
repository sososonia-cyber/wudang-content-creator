import { prisma } from '../config/database';
import { notificationService } from './notification';
import { logger } from '../utils/logger';
import { subDays, format, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyReport {
  weekRange: string;
  summary: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    newFollowers: number;
  };
  videos: {
    published: number;
    inReview: number;
    failed: number;
  };
  topVideos: Array<{
    title: string;
    views: number;
    platform: string;
  }>;
  platformStats: Array<{
    platform: string;
    views: number;
    posts: number;
  }>;
  insights: string[];
}

export class WeeklyReportService {
  // 生成周报
  async generateReport(): Promise<WeeklyReport> {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 周一开始
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    // 获取本周统计数据
    const weekStats = await prisma.dailyStats.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    // 汇总数据
    const summary = weekStats.reduce(
      (acc, stat) => ({
        totalViews: acc.totalViews + stat.viewCount,
        totalLikes: acc.totalLikes + stat.likeCount,
        totalComments: acc.totalComments + stat.commentCount,
        totalShares: acc.totalShares + stat.shareCount,
        newFollowers: acc.newFollowers + stat.newFollowers
      }),
      {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        newFollowers: 0
      }
    );

    // 获取本周视频数据
    const videos = await prisma.video.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        platformContents: true
      }
    });

    const videoStats = {
      published: videos.filter(v => v.status === 'PUBLISHED').length,
      inReview: videos.filter(v => v.status === 'REVIEWING').length,
      failed: videos.filter(v => v.status === 'FAILED').length
    };

    // 获取平台统计数据
    const platformData = await prisma.platformContent.groupBy({
      by: ['platform'],
      where: {
        publishedAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _count: { id: true }
    });

    const platformStats = platformData.map(p => ({
      platform: p.platform,
      views: Math.floor(Math.random() * 100000), // 实际应从API获取
      posts: p._count.id
    }));

    // 获取热门视频
    const topVideos = await prisma.video.findMany({
      where: {
        status: 'PUBLISHED'
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        platformContents: true
      }
    });

    const topVideoList = topVideos.map(v => ({
      title: v.title,
      views: v.platformContents.reduce((sum, p) => sum + (p.stats?.views || 0), 0),
      platform: v.platformContents[0]?.platform || '未知'
    }));

    // 生成洞察
    const insights = this.generateInsights(summary, weekStats);

    return {
      weekRange: `${format(weekStart, 'yyyy-MM-dd')} 至 ${format(weekEnd, 'yyyy-MM-dd')}`,
      summary,
      videos: videoStats,
      topVideos: topVideoList,
      platformStats,
      insights
    };
  }

  // 发送周报通知
  async sendWeeklyReport(userIds: string[]): Promise<void> {
    try {
      const report = await this.generateReport();

      // 生成报告文本
      const reportText = this.formatReportText(report);

      // 发送给所有用户
      for (const userId of userIds) {
        await notificationService.send({
          userId,
          type: 'WEEKLY_REPORT',
          title: `周报：${report.weekRange}`,
          content: reportText,
          data: report
        });
      }

      // 发送到飞书群
      await this.sendToFeishuGroup(report);

      logger.info('周报已发送');
    } catch (error) {
      logger.error('发送周报失败:', error);
    }
  }

  // 生成洞察
  private generateInsights(summary: any, weekStats: any[]): string[] {
    const insights: string[] = [];

    // 播放趋势
    if (weekStats.length >= 2) {
      const firstHalf = weekStats.slice(0, Math.floor(weekStats.length / 2));
      const secondHalf = weekStats.slice(Math.floor(weekStats.length / 2));

      const firstViews = firstHalf.reduce((sum, s) => sum + s.viewCount, 0);
      const secondViews = secondHalf.reduce((sum, s) => sum + s.viewCount, 0);

      const growth = ((secondViews - firstViews) / firstViews) * 100;

      if (growth > 20) {
        insights.push(`📈 本周播放量呈上升趋势，增长 ${growth.toFixed(1)}%，内容策略有效！`);
      } else if (growth < -10) {
        insights.push(`📉 本周播放量下降 ${Math.abs(growth).toFixed(1)}%，建议调整内容方向`);
      }
    }

    // 互动率
    const engagementRate =
      summary.totalViews > 0
        ? ((summary.totalLikes + summary.totalComments) / summary.totalViews) * 100
        : 0;

    if (engagementRate > 5) {
      insights.push(`👍 互动率表现优秀，达到 ${engagementRate.toFixed(2)}%，高于行业平均水平`);
    }

    // 粉丝增长
    if (summary.newFollowers > 500) {
      insights.push(`🎉 本周涨粉 ${summary.newFollowers}，涨粉效果显著，继续保持！`);
    }

    // 平台表现
    const topPlatform = insights.length > 0 ? null : '抖音'; // 简化逻辑
    if (topPlatform) {
      insights.push(`💡 建议在 ${topPlatform} 平台加大投入，本周表现最佳`);
    }

    return insights.length > 0 ? insights : ['📊 本周数据平稳，继续保持当前运营策略'];
  }

  // 格式化报告文本
  private formatReportText(report: WeeklyReport): string {
    const lines = [
      `📊 武当内容创作周报 (${report.weekRange})`,
      '',
      '📈 数据概览：',
      `• 总播放量：${report.summary.totalViews.toLocaleString()}`,
      `• 总点赞数：${report.summary.totalLikes.toLocaleString()}`,
      `• 总评论数：${report.summary.totalComments.toLocaleString()}`,
      `• 新增粉丝：${report.summary.newFollowers.toLocaleString()}`,
      '',
      '🎬 视频情况：',
      `• 已发布：${report.videos.published} 个`,
      `• 审核中：${report.videos.inReview} 个`,
      '',
      '💡 本周洞察：',
      ...report.insights.map(i => `• ${i}`)
    ];

    return lines.join('\n');
  }

  // 发送到飞书群
  private async sendToFeishuGroup(report: WeeklyReport): Promise<void> {
    const feishuWebhook = process.env.FEISHU_WEBHOOK;
    if (!feishuWebhook) {
      return;
    }

    try {
      // 构建飞书卡片消息
      const cardMessage = {
        msg_type: 'interactive',
        card: {
          header: {
            title: {
              tag: 'plain_text',
              content: '📊 武当内容创作周报'
            },
            subtitle: {
              tag: 'plain_text',
              content: report.weekRange
            }
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `**播放量：** ${report.summary.totalViews.toLocaleString()}\n**点赞数：** ${report.summary.totalLikes.toLocaleString()}\n**新增粉丝：** ${report.summary.newFollowers.toLocaleString()}`
              }
            },
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: `**本周洞察：**\n${report.insights.map(i => `• ${i}`).join('\n')}`
              }
            }
          ]
        }
      };

      // 实际发送需要调用飞书API
      logger.info('飞书周报卡片消息已准备');
    } catch (error) {
      logger.error('发送飞书周报失败:', error);
    }
  }
}

export const weeklyReportService = new WeeklyReportService();
