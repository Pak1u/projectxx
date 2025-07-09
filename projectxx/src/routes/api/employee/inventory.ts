import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, InventoryLocation, InventoryItem } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

// GET /api/employee/inventory
router.get('/', authenticateToken, requireAuth, requireRole('EMPLOYEE'), asyncHandler(async (req, res) => {
  const items = await prisma.inventoryItem.findMany();
  res.json(items);
}));

interface UpdateInventoryBody {
  name?: string;
  price?: number;
}
// PATCH /api/employee/inventory/:itemId
router.patch('/:itemId', authenticateToken, requireAuth, requireRole('EMPLOYEE'), asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { name, price } = req.body as UpdateInventoryBody;
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (price !== undefined) data.price = price;
  const item = await prisma.inventoryItem.update({ where: { id: parseInt(itemId, 10) }, data });
  res.json(item);
}));

export default router; 