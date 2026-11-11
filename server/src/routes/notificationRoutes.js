import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../validators/validate.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateObjectId('id'), markAsRead);

export default router;
