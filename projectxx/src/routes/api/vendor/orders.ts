import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

interface OrderItemInput {
  itemName: string;
  quantity: number;
  unitPrice: number;
}
interface CreateOrderBody {
  items: OrderItemInput[];
  totalAmount: number;
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// POST /api/vendor/orders/create
router.post('/create', authenticateToken, requireAuth, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { items, totalAmount } = req.body as CreateOrderBody;
  const user = (req as any).user;
  const vendor = await prisma.vendor.findFirst({ where: { user: { id: user.userId } } });
  if (!vendor) {
    res.status(403).json({ error: 'Vendor not found' });
    return;
  }
  const order = await prisma.order.create({
    data: {
      vendorId: vendor.id,
      status: OrderStatus.PENDING,
      totalAmount,
      items: {
        create: items.map(item => ({ ...item }))
      }
    },
    include: { items: true }
  });
  res.status(201).json(order);
}));

// GET /api/vendor/orders
router.get('/', authenticateToken, requireAuth, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const vendor = await prisma.vendor.findFirst({ where: { user: { id: user.userId } } });
  if (!vendor) {
    res.status(403).json({ error: 'Vendor not found' });
    return;
  }
  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    include: { items: true }
  });
  res.json({ orders });
}));

export default router; 