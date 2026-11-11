import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/userController.js';
import { validate } from '../validators/validate.js';
import { updateProfileSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', validate(updateProfileSchema), updateMe);

export default router;
