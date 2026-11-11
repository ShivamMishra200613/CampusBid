import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);

export default router;
