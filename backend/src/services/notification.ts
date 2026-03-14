import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  content: string;
  data?: any;
}

export class NotificationService {
  // 发送通知
  async send(notification: NotificationData): Promise<void> {
    try {
      // 保存到数据库
      await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          data: notification.data || {},
          isRead: false
        }
      });

      // 发送到飞书（如果配置了）
      await this.sendToFeishu(notification);

      logger.info(`通知已发送: ${notification.title} -> ${notification.userId}`);
    } catch (error) {
      logger.error('发送通知失败:', error);
    }
  }

  // 批量发送通知
  async sendBulk(userIds: string[], notification: Omit<NotificationData, 'userId'>): Promise<void> {
    await Promise.all(
      userIds.map(userId =>
        this.send({ ...notification, userId })
      )
    );
  }

  // 获取用户通知列表
  async getUserNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    const where: any = { userId };
    if (options?.unreadOnly) {
      where.isRead = false;
    }

    return await prisma.notification.findMany({
      where,
      take: options?.limit || 50,
      orderBy: { createdAt: 'desc' }
    });
  }

  // 标记已读
  async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  // 标记全部已读
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  // 获取未读数量
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  // 发送到飞书
  private async sendToFeishu(notification: NotificationData): Promise<void> {
    const feishuWebhook = process.env.FEISHU_WEBHOOK;
    if (!feishuWebhook) {
      return;
    }

    try {
      // 这里实现飞书机器人消息推送
      // 需要调用飞书API
      logger.info(`飞书通知: ${notification.title}`);
    } catch (error) {
      logger.error('发送飞书通知失败:', error);
    }
  }

  // 发送任务分配通知
  async sendTaskAssigned(taskId: string, assigneeId: string, assignerName: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true }
    });

    if (task) {
      await this.send({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: '新任务分配',
        content: `${assignerName} 给您分配了任务《${task.title}》`,
        data: { taskId }
      });
    }
  }

  // 发送任务截止提醒
  async sendTaskDueReminder(taskId: string, userId: string, hoursLeft: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, dueDate: true }
    });

    if (task) {
      await this.send({
        userId,
        type: 'TASK_DUE_REMINDER',
        title: '任务截止提醒',
        content: `任务《${task.title}》将在 ${hoursLeft} 小时后截止`,
        data: { taskId, dueDate: task.dueDate }
      });
    }
  }

  // 发送内容发布通知
  async sendPublishNotification(videoId: string, userId: string, platform: string, status: 'success' | 'failed'): Promise<void> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { title: true }
    });

    if (video) {
      await this.send({
        userId,
        type: status === 'success' ? 'PUBLISH_SUCCESS' : 'PUBLISH_FAILED',
        title: status === 'success' ? '发布成功' : '发布失败',
        content: status === 'success' 
          ? `《${video.title}》已成功发布到 ${platform}`
          : `《${video.title}》发布到 ${platform} 失败，请检查`,
        data: { videoId, platform, status }
      });
    }
  }
}

export const notificationService = new NotificationService();
