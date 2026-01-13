import { Router } from 'express';
import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CLIENT']), createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), updateProject);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN']), deleteProject);

export default router;
