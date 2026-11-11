import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  reportProduct
} from '../controllers/productController.js';
import { placeBid, getProductBids } from '../controllers/bidController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, validateObjectId } from '../validators/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  placeBidSchema,
  reportListingSchema
} from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, getProducts);
router.get('/mine', authenticate, getMyProducts);
router.post('/', authenticate, validate(createProductSchema), createProduct);

router.get('/:id', validateObjectId('id'), getProductById);
router.put('/:id', authenticate, validateObjectId('id'), validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, validateObjectId('id'), deleteProduct);

router.post('/:id/bids', authenticate, validateObjectId('id'), validate(placeBidSchema), placeBid);
router.get('/:id/bids', validateObjectId('id'), getProductBids);

router.post('/:id/publish', authenticate, validateObjectId('id'), publishProduct);
router.post('/:id/report', authenticate, validateObjectId('id'), validate(reportListingSchema), reportProduct);

export default router;
