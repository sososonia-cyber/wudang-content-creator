import { Router } from 'express';
import { videoController } from '../controllers/videos';

const router = Router();

// 视频 CRUD
router.get('/', videoController.list);
router.post('/', videoController.create);
router.get('/:id', videoController.getById);
router.put('/:id', videoController.update);
router.delete('/:id', videoController.delete);

// 视频生成
router.post('/:id/generate', videoController.generate);
router.get('/:id/status', videoController.getGenerationStatus);

// 平台适配
router.post('/:id/adapt', videoController.adaptToPlatforms);

export default router;
