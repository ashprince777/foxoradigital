import { Router } from 'express';
import { createContent, getAllContent, getContentById, updateContent, deleteContent } from '../controllers/contentController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createContent);
router.get('/', getAllContent);
router.get('/:id', getContentById);
router.put('/:id', updateContent);
router.delete('/:id', deleteContent);

export default router;
