import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from '../services/notification';

// 审批流程配置
const APPROVAL_FLOW = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['REVISING', 'PENDING_APPROVAL'],
  REVISING: ['PENDING_REVIEW'],
  PENDING_APPROVAL: ['APPROVED', 'REVISING'],
  APPROVED: ['PUBLISHED'],
  PUBLISHED: [],
  CANCELLED: []
};

const createApprovalSchema = z.object({
  videoId: z.string(),
  approverIds: z.array(z.string()).min(1),
  description: z.string().optional()
});

const reviewSchema = z.object({
  approvalId: z.string(),
  action: z.enum(['approve', 'reject', 'revise']),
  comment: z.string().optional()
});

export const approvalController = {
  // 创建审批流程
  createApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId, approverIds, description } = createApprovalSchema.parse(req.body);

      // 检查视频是否存在
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { tasks: true }
      });

      if (!video) {
        throw new AppError('视频不存在', 404);
      }

      // 创建审批记录
      const approval = await prisma.approval.create({
        data: {
          videoId,
          status: 'PENDING_REVIEW',
          description,
          approvers: {
            create: approverIds.map((userId, index) => ({
              userId,
              order: index + 1,
              status: index === 0 ? 'PENDING' : 'WAITING'
            }))
          }
        },
        include: {
          approvers: {
            include: {
              user: {
                select: { id: true, username: true, email: true }
              }
            }
          },
          video: {
            select: { id: true, title: true }
          }
        }
      });

      // 通知第一个审批人
      const firstApprover = approval.approvers[0];
      if (firstApprover) {
        await notificationService.send({
          userId: firstApprover.userId,
          type: 'APPROVAL_REQUIRED',
          title: '待审批内容',
          content: `您有一个待审批的视频《${video.title}》`,
          data: { approvalId: approval.id, videoId }
        });
      }

      res.status(201).json({
        success: true,
        message: '审批流程已创建',
        data: approval
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取审批列表
  listApprovals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, videoId, page = '1', limit = '20' } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (videoId) where.videoId = videoId;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [approvals, total] = await Promise.all([
        prisma.approval.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: 'desc' },
          include: {
            video: {
              select: { id: true, title: true, status: true }
            },
            approvers: {
              include: {
                user: {
                  select: { id: true, username: true, avatarUrl: true }
                }
              }
            },
            _count: {
              select: { comments: true }
            }
          }
        }),
        prisma.approval.count({ where })
      ]);

      res.json({
        success: true,
        data: approvals,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 处理审批
  processApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { approvalId, action, comment } = reviewSchema.parse(req.body);

      const approval = await prisma.approval.findUnique({
        where: { id: approvalId },
        include: {
          approvers: {
            include: {
              user: {
                select: { id: true, username: true, email: true }
              }
            }
          },
          video: {
            select: { id: true, title: true, createdById: true }
          }
        }
      });

      if (!approval) {
        throw new AppError('审批记录不存在', 404);
      }

      // 找到当前审批人
      const currentApprover = approval.approvers.find(
        a => a.status === 'PENDING'
      );

      if (!currentApprover) {
        throw new AppError('当前没有待处理的审批', 400);
      }

      // 更新审批人状态
      await prisma.approvalApprover.update({
        where: { id: currentApprover.id },
        data: {
          status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'REVISED',
          comment,
          processedAt: new Date()
        }
      });

      // 添加审批评论
      if (comment) {
        await prisma.approvalComment.create({
          data: {
            approvalId,
            userId: currentApprover.userId,
            content: comment,
            type: action === 'approve' ? 'APPROVE' : action === 'reject' ? 'REJECT' : 'REVISION'
          }
        });
      }

      let newStatus = approval.status;
      let notificationMessage = '';

      if (action === 'approve') {
        // 查找下一个审批人
        const nextApprover = approval.approvers.find(
          a => a.order === currentApprover.order + 1
        );

        if (nextApprover) {
          // 更新下一个审批人状态
          await prisma.approvalApprover.update({
            where: { id: nextApprover.id },
            data: { status: 'PENDING' }
          });
          
          newStatus = 'PENDING_APPROVAL';
          notificationMessage = `您有一个待审批的视频《${approval.video.title}》`;
          
          // 通知下一个审批人
          await notificationService.send({
            userId: nextApprover.userId,
            type: 'APPROVAL_REQUIRED',
            title: '待审批内容',
            content: notificationMessage,
            data: { approvalId, videoId: approval.videoId }
          });
        } else {
          // 全部审批通过
          newStatus = 'APPROVED';
          
          // 更新视频状态
          await prisma.video.update({
            where: { id: approval.videoId },
            data: { status: 'APPROVED' }
          });

          // 通知创建人
          if (approval.video.createdById) {
            await notificationService.send({
              userId: approval.video.createdById,
              type: 'APPROVAL_COMPLETED',
              title: '审批通过',
              content: `您的视频《${approval.video.title}》已通过审批`,
              data: { approvalId, videoId: approval.videoId }
            });
          }
        }
      } else if (action === 'reject') {
        newStatus = 'REJECTED';
        
        // 通知创建人
        if (approval.video.createdById) {
          await notificationService.send({
            userId: approval.video.createdById,
            type: 'APPROVAL_REJECTED',
            title: '审批未通过',
            content: `您的视频《${approval.video.title}》未通过审批，请修改`,
            data: { approvalId, videoId: approval.videoId }
          });
        }
      } else if (action === 'revise') {
        newStatus = 'REVISING';
        
        // 通知创建人
        if (approval.video.createdById) {
          await notificationService.send({
            userId: approval.video.createdById,
            type: 'REVISION_REQUIRED',
            title: '需要修改',
            content: `您的视频《${approval.video.title}》需要修改：${comment || ''}`,
            data: { approvalId, videoId: approval.videoId }
          });
        }
      }

      // 更新审批状态
      const updatedApproval = await prisma.approval.update({
        where: { id: approvalId },
        data: { status: newStatus },
        include: {
          approvers: {
            include: {
              user: {
                select: { id: true, username: true }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        message: '审批处理成功',
        data: updatedApproval
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取审批详情
  getApprovalDetail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const approval = await prisma.approval.findUnique({
        where: { id },
        include: {
          video: true,
          approvers: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true }
              }
            }
          },
          comments: {
            include: {
              user: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!approval) {
        throw new AppError('审批记录不存在', 404);
      }

      res.json({
        success: true,
        data: approval
      });
    } catch (error) {
      next(error);
    }
  }
};
