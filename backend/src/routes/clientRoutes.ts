import { Router } from 'express';
import { createClient, getAllClients, getClientById, updateClient, deleteClient } from '../controllers/clientController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['SUPER_ADMIN', 'ADMIN']), createClient);
router.get('/', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CREATOR']), getAllClients);
router.get('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), getClientById);
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN']), updateClient);
router.delete('/:id', authorize(['SUPER_ADMIN']), deleteClient);

export default router;
