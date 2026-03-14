import { Router } from 'express';
import { statsController } from '../controllers/stats';

const router = Router();

// 数据看板
router.get('/dashboard', statsController.dashboard);

// 每日统计
router.get('/daily', statsController.daily);

// 生成周报
router.get('/weekly-report', statsController.weeklyReport);

export default router;
