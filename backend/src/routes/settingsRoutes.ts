import express from 'express';
import { getSettings, updateSignature } from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.get('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getSettings);
router.post('/signature', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), upload.single('signature'), updateSignature);

export default router;
