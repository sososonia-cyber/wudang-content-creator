import { Router } from 'express';
import { trendController } from '../controllers/trends';

const router = Router();

// 热点列表
router.get('/', trendController.list);

// 热点预测 (MiroFish)
router.get('/prediction', trendController.prediction);

// 武当相关热点
router.get('/wudang', trendController.wudang);

// 手动抓取热点
router.post('/fetch', trendController.fetchTrends);

// 创建热点响应内容
router.post('/response', trendController.createResponse);

export default router;
