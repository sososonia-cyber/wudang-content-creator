import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { publishService } from '../services/publish';
import { weeklyReportService } from '../services/weeklyReport';

// 定时任务列表
const tasks: cron.ScheduledTask[] = [];

export const initSchedulers = () => {
  logger.info('🔄 初始化定时任务...');

  // 1. 每小时抓取热点数据
  const trendTask = cron.schedule('0 * * * *', async () => {
    logger.info('⏰ 执行热点数据抓取任务');
    await fetchTrends();
  });
  tasks.push(trendTask);

  // 2. 每天早上9点发送节日提醒
  const festivalTask = cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ 执行节日提醒检查');
    await checkFestivals();
  });
  tasks.push(festivalTask);

  // 3. 每分钟检查待发布的排期内容
  const publishTask = cron.schedule('* * * * *', async () => {
    await checkScheduledPublish();
  });
  tasks.push(publishTask);

  // 4. 每天凌晨2点生成日报
  const dailyReportTask = cron.schedule('0 2 * * *', async () => {
    logger.info('⏰ 生成每日数据报告');
    await generateDailyReport();
  });
  tasks.push(dailyReportTask);

  // 5. 每周一早9点生成并发送周报
  const weeklyReportTask = cron.schedule('0 9 * * 1', async () => {
    logger.info('⏰ 生成并发送周报');
    await generateWeeklyReport();
  });
  tasks.push(weeklyReportTask);

  // 6. 每5秒检查一次待发布队列（使用Redis）
  const publishCheckTask = cron.schedule('*/5 * * * * *', async () => {
    await publishService.checkAndExecuteScheduled();
  });
  tasks.push(publishCheckTask);

  logger.info('✅ 定时任务初始化完成');
};

// 抓取热点数据
const fetchTrends = async () => {
  try {
    // TODO: 调用 Qveris API 获取热点
    logger.info('📊 热点数据抓取完成');
  } catch (error) {
    logger.error('❌ 热点数据抓取失败:', error);
  }
};

// 检查节日提醒
const checkFestivals = async () => {
  try {
    const today = new Date();
    const festivals = getUpcomingFestivals(today);
    
    if (festivals.length > 0) {
      logger.info(`🎉 发现 ${festivals.length} 个即将到来的节日/节气`);
      // TODO: 发送通知
    }
  } catch (error) {
    logger.error('❌ 节日检查失败:', error);
  }
};

// 检查待发布内容
const checkScheduledPublish = async () => {
  try {
    const now = new Date();
    const scheduledContents = await prisma.platformContent.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now
        }
      }
    });

    for (const content of scheduledContents) {
      logger.info(`📤 发布内容: ${content.title}`);
      // TODO: 调用平台 API 发布
      
      await prisma.platformContent.update({
        where: { id: content.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now
        }
      });
    }
  } catch (error) {
    logger.error('❌ 发布检查失败:', error);
  }
};

// 生成每日报告
const generateDailyReport = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = await prisma.dailyStats.findUnique({
      where: { date: yesterday }
    });

    if (!stats) {
      // 创建新的统计记录
      const videoCount = await prisma.video.count({
        where: {
          createdAt: {
            gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59, 999))
          }
        }
      });

      await prisma.dailyStats.create({
        data: {
          date: yesterday,
          videoCount
        }
      });
    }

    logger.info('📈 每日报告生成完成');
  } catch (error) {
    logger.error('❌ 日报生成失败:', error);
  }
};

// 生成并发送周报
const generateWeeklyReport = async () => {
  try {
    // 获取所有用户ID
    const users = await prisma.user.findMany({
      select: { id: true }
    });
    const userIds = users.map(u => u.id);

    // 生成并发送周报
    await weeklyReportService.sendWeeklyReport(userIds);
    
    logger.info('📊 周报生成并发送完成');
  } catch (error) {
    logger.error('❌ 周报生成失败:', error);
  }
};

// 获取即将到来的节日
function getUpcomingFestivals(date: Date): Array<{name: string; date: Date}> {
  // 简化的节日列表，实际应从农历库获取
  const festivals = [
    { name: '春节', month: 1, day: 1 },
    { name: '元宵节', month: 1, day: 15 },
    { name: '清明节', month: 4, day: 4 },
    { name: '端午节', month: 5, day: 5 },
    { name: '中秋节', month: 8, day: 15 },
    { name: '重阳节', month: 9, day: 9 }
  ];

  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();

  return festivals
    .filter(f => {
      if (f.month === currentMonth) {
        return f.day >= currentDay && f.day <= currentDay + 7;
      }
      return false;
    })
    .map(f => ({
      name: f.name,
      date: new Date(date.getFullYear(), f.month - 1, f.day)
    }));
}

// 停止所有定时任务
export const stopSchedulers = () => {
  tasks.forEach(task => task.stop());
  logger.info('👋 定时任务已停止');
};
