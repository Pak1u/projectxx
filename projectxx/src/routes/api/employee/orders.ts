import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

interface UpdateOrderStatusBody {
  status: keyof typeof OrderStatus;
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// PATCH /api/employee/orders/:orderId/status
router.patch('/:orderId/status', authenticateToken, requireAuth, requireRole('EMPLOYEE'), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body as UpdateOrderStatusBody;
  if (!Object.values(OrderStatus).includes(status as any)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true }
  });
  res.json(order);
}));

export default router; 