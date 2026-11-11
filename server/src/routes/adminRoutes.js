import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateObjectId } from '../validators/validate.js';
import {
  moderateListingSchema,
  resolveReportSchema
} from '../validators/schemas.js';
import {
  getAdminStats,
  getPendingListings,
  moderateListing,
  getReports,
  resolveReport,
  getAdminUsers,
  suspendUser,
  unsuspendUser
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/listings/pending', getPendingListings);
router.post('/listings/:id/moderate', validateObjectId('id'), validate(moderateListingSchema), moderateListing);

router.get('/reports', getReports);
router.post('/reports/:id/resolve', validateObjectId('id'), validate(resolveReportSchema), resolveReport);

router.get('/users', getAdminUsers);
router.patch('/users/:id/suspend', validateObjectId('id'), suspendUser);
router.patch('/users/:id/unsuspend', validateObjectId('id'), unsuspendUser);

export default router;
