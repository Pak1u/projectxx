import { Router } from 'express';
import { authenticateToken, requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, requireAuth, requireRole('VENDOR'), (req, res) => {
  res.json({ message: 'Vendor dashboard' });
});

export default router; 