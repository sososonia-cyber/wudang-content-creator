import { Router } from 'express';

const router = Router();

// 系统配置
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '武当内容创作系统',
      version: '3.0.0',
      features: {
        videoGeneration: true,
        trendTracking: true,
        platformAdaptation: true,
        teamCollaboration: true,
        dataAnalytics: true
      }
    }
  });
});

// 节日列表
router.get('/festivals', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: '春节', date: '2026-02-17', daysUntil: 340 },
      { name: '清明节', date: '2026-04-05', daysUntil: 22 },
      { name: '端午节', date: '2026-06-19', daysUntil: 97 }
    ]
  });
});

export default router;
