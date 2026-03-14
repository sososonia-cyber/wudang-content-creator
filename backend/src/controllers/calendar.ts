import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const createCalendarSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  scheduledDate: z.string(),
  scheduledTime: z.string().optional(),
  type: z.enum(['video', 'publish', 'task']).default('publish'),
  videoId: z.string().optional()
});

export const calendarController = {
  // 获取日历列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate && endDate) {
        where.scheduledDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const entries = await prisma.contentCalendar.findMany({
        where,
        orderBy: { scheduledDate: 'asc' },
        include: {
          video: {
            select: { id: true, title: true, status: true }
          }
        }
      });

      res.json({
        success: true,
        data: entries
      });
    } catch (error) {
      next(error);
    }
  },

  // 创建日历项
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createCalendarSchema.parse(req.body);

      const entry = await prisma.contentCalendar.create({
        data: {
          title: validatedData.title,
          scheduledDate: new Date(validatedData.scheduledDate),
          scheduledTime: validatedData.scheduledTime ? new Date(`1970-01-01T${validatedData.scheduledTime}`) : null,
          status: 'scheduled',
          videoId: validatedData.videoId
        },
        include: {
          video: {
            select: { id: true, title: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: '日历项创建成功',
        data: entry
      });
    } catch (error) {
      next(error);
    }
  },

  // 检查冲突
  checkConflicts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      const weekLater = new Date(today);
      weekLater.setDate(weekLater.getDate() + 7);

      // 查找同一天有多个排期的日期
      const entries = await prisma.contentCalendar.findMany({
        where: {
          scheduledDate: {
            gte: today,
            lte: weekLater
          }
        }
      });

      // 按日期分组
      const groupedByDate = entries.reduce((acc, entry) => {
        const dateStr = entry.scheduledDate.toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(entry);
        return acc;
      }, {} as Record<string, typeof entries>);

      // 找出有冲突的日期
      const conflicts = Object.entries(groupedByDate)
        .filter(([_, items]) => items.length > 1)
        .map(([date, items]) => ({
          date,
          count: items.length,
          items
        }));

      res.json({
        success: true,
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
