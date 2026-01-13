import { Router } from 'express';
import { createTask, getAllTasks, getTaskById, updateTask, deleteTask } from '../controllers/taskController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), deleteTask);

export default router;
