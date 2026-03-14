import { Router } from 'express';
import { approvalController } from '../controllers/approval';
import { publishController } from '../controllers/publish';
import { exportController } from '../controllers/export';

const router = Router();

// 审批流程
router.get('/approvals', approvalController.listApprovals);
router.post('/approvals', approvalController.createApproval);
router.get('/approvals/:id', approvalController.getApprovalDetail);
router.post('/approvals/process', approvalController.processApproval);

// 发布管理
router.post('/publish/schedule', publishController.schedulePublish);
router.post('/publish/now', publishController.publishNow);
router.get('/publish/status/:id', publishController.getPublishStatus);
router.post('/publish/cancel/:id', publishController.cancelPublish);
router.get('/publish/queue', publishController.getPublishQueue);

// 数据导出
router.get('/export/csv', exportController.exportCSV);
router.get('/export/excel', exportController.exportExcel);
router.get('/export/pdf', exportController.exportPDF);

export default router;
