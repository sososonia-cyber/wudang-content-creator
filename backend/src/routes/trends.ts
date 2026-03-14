import { Router } from 'express';

const router = Router();

// 热点列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '热点列表接口 (开发中)'
  });
});

// 热点预测 (MiroFish)
router.get('/prediction', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '热点预测接口 (开发中)'
  });
});

// 武当相关热点
router.get('/wudang', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '武当相关热点接口 (开发中)'
  });
});

// 创建热点响应内容
router.post('/response', (req, res) => {
  res.json({
    success: true,
    message: '热点响应接口 (开发中)'
  });
});

export default router;
