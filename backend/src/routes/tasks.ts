import { Router } from 'express';

const router = Router();

// 任务列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '任务列表接口 (开发中)'
  });
});

// 创建任务
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: '创建任务接口 (开发中)'
  });
});

// 更新任务状态
router.put('/:id/status', (req, res) => {
  res.json({
    success: true,
    message: '更新任务状态接口 (开发中)'
  });
});

export default router;
