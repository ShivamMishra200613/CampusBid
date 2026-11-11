import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMyBids } from '../controllers/bidController.js';

const router = Router();

router.get('/my-bids', authenticate, getMyBids);

export default router;
