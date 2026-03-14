import { Router } from 'express';
import { calendarController } from '../controllers/calendar';

const router = Router();

// 获取日历
router.get('/', calendarController.list);

// 添加日历项
router.post('/', calendarController.create);

// 检查冲突
router.get('/conflicts', calendarController.checkConflicts);

export default router;
