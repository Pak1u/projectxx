import { Router } from 'express';
import { authenticateToken, requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/test', authenticateToken, requireAuth, (req, res) => {
  const { userId, role } = (req as any).user || {};
  res.json({ userId, role });
});

export default router; 