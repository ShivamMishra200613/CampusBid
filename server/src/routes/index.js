import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import bidRoutes from './bidRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/bids', bidRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
