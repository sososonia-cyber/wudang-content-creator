import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const createTaskSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  taskType: z.enum(['CONTENT', 'REVIEW', 'APPROVAL', 'PUBLISH']).default('CONTENT'),
  assigneeId: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z.string().optional(),
  videoId: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'REVISING', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'CANCELLED'])
});

export const taskController = {
  // 获取任务列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assigneeId, priority } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (assigneeId) where.assigneeId = assigneeId;
      if (priority) where.priority = priority;

      const tasks = await prisma.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          assignee: {
            select: { id: true, username: true, avatarUrl: true }
          },
          creator: {
            select: { id: true, username: true }
          },
          video: {
            select: { id: true, title: true }
          }
        }
      });

      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  },

  // 创建任务
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createTaskSchema.parse(req.body);

      const task = await prisma.task.create({
        data: {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
        },
        include: {
          assignee: {
            select: { id: true, username: true }
          },
          video: {
            select: { id: true, title: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: '任务创建成功',
        data: task
      });
    } catch (error) {
      next(error);
    }
  },

  // 更新任务状态
  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = updateStatusSchema.parse(req.body);

      const task = await prisma.task.findUnique({
        where: { id }
      });

      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      const updateData: any = { status };
      
      // 如果状态为已发布或已通过，记录完成时间
      if (status === 'PUBLISHED' || status === 'APPROVED') {
        updateData.completedAt = new Date();
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: {
            select: { id: true, username: true }
          },
          video: {
            select: { id: true, title: true }
          }
        }
      });

      res.json({
        success: true,
        message: '任务状态更新成功',
        data: updatedTask
      });
    } catch (error) {
      next(error);
    }
  },

  // 添加评论
  addComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const task = await prisma.task.findUnique({
        where: { id }
      });

      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      const comments = (task.comments as any[]) || [];
      comments.push({
        id: Date.now().toString(),
        content,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user' // TODO: 从JWT获取
      });

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { comments: comments as any }
      });

      res.json({
        success: true,
        message: '评论添加成功',
        data: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }
};
