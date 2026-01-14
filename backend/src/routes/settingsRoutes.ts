import express from 'express';
import { getSettings, updateSignature } from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import multer from 'multer';

const router = express.Router();

// Configure Multer for memory storage (Serverless)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

router.get('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getSettings);
router.post('/signature', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), upload.single('signature'), updateSignature);

export default router;
