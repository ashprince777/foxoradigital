import { Router } from 'express';
import { getInvoices, createInvoice, updateInvoiceStatus, downloadInvoice, recordPayment, getPendingAmounts, generateMonthlyInvoices, generateCustomInvoice, deleteInvoice, applyDiscount } from '../controllers/invoiceController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/pending-amounts', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), getPendingAmounts);
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), createInvoice);
router.post('/payment', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), recordPayment);
router.post('/discount', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), applyDiscount);
router.post('/generate-monthly', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), generateMonthlyInvoices);
router.post('/generate-custom', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), generateCustomInvoice);
router.put('/:id/status', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), updateInvoiceStatus);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']), deleteInvoice);
router.get('/:id/download', downloadInvoice);

export default router;
