import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, createUser } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['SUPER_ADMIN', 'ADMIN']), createUser);
router.get('/', authorize(['SUPER_ADMIN', 'ADMIN', 'CREATOR']), getAllUsers);
router.get('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), getUserById);
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN']), updateUser);
router.delete('/:id', authorize(['SUPER_ADMIN']), deleteUser);

export default router;
