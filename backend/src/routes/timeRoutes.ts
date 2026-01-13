import { Router } from 'express';
import { startTimeEntry, stopTimeEntry, logManualTime, getTimeEntries, getProductivityStats, getCurrentEntry } from '../controllers/timeController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/start', startTimeEntry);
router.put('/:id/stop', stopTimeEntry);
router.post('/log', logManualTime);
router.get('/current', getCurrentEntry);
router.get('/', getTimeEntries);
router.get('/stats', getProductivityStats);

export default router;
