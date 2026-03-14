import { Router } from 'express';

const router = Router();

// 数据看板
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      today: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      trend: [],
      platforms: [],
      topVideos: []
    },
    message: '数据看板接口 (开发中)'
  });
});

// 每日统计
router.get('/daily', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '每日统计接口 (开发中)'
  });
});

// 生成周报
router.get('/weekly-report', (req, res) => {
  res.json({
    success: true,
    data: {},
    message: '周报生成接口 (开发中)'
  });
});

export default router;
