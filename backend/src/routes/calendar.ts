import { Router } from 'express';

const router = Router();

// 获取日历
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '内容日历接口 (开发中)'
  });
});

// 添加日历项
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: '添加日历项接口 (开发中)'
  });
});

// 检查冲突
router.get('/conflicts', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '冲突检查接口 (开发中)'
  });
});

export default router;
