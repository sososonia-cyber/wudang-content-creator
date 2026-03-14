import { Router } from 'express';
import { taskController } from '../controllers/tasks';

const router = Router();

// 任务列表
router.get('/', taskController.list);

// 创建任务
router.post('/', taskController.create);

// 更新任务状态
router.put('/:id/status', taskController.updateStatus);

// 添加评论
router.post('/:id/comments', taskController.addComment);

export default router;
