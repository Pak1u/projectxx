import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

interface GenerateBillingBody {
  orderId: string;
  amount: number;
}
// POST /api/billing/generate
router.post('/generate', authenticateToken, requireAuth, requireRole('EMPLOYEE'), asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body as GenerateBillingBody;
  const user = (req as any).user;
  const employee = await prisma.walmartEmployee.findFirst({ where: { user: { id: user.userId } } });
  if (!employee) {
    res.status(403).json({ error: 'Employee not found' });
    return;
  }
  if (!employee.warehouseId) {
    res.status(400).json({ error: 'Employee is not assigned to a warehouse' });
    return;
  }
  const billing = await prisma.billingRecord.create({
    data: {
      orderId,
      generatedById: employee.id,
      amount,
      warehouseId: employee.warehouseId,
    }
  });
  res.status(201).json(billing);
}));

// GET /api/billing/:orderId
router.get('/:orderId', authenticateToken, requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const billing = await prisma.billingRecord.findMany({
    where: { orderId },
    include: { order: true, generatedBy: true }
  });
  if (!billing.length) {
    res.status(404).json({ error: 'No billing record found for this order' });
    return;
  }
  res.json({ billing });
}));

export default router; 