import { Router } from 'express';
import { authenticateToken, requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, requireAuth, requireRole('EMPLOYEE'), (req, res) => {
  res.json({ message: 'Employee dashboard' });
});

export default router; 