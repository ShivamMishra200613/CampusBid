import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/', authenticate, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'Please select at least one image file to upload.'
        }
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Maximum 5 images allowed per upload.'
        }
      });
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);

    res.status(201).json({
      success: true,
      urls,
      url: urls[0],
      count: urls.length
    });
  });
});

export default router;
