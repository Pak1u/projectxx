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
  const grouped = items.reduce((acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
    (acc[item.location] = acc[item.location] || []).push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);
  res.json({ inventory: grouped });
}));

interface UpdateInventoryBody {
  quantity?: number;
  location?: keyof typeof InventoryLocation;
}
// PATCH /api/employee/inventory/:itemId
router.patch('/:itemId', authenticateToken, requireAuth, requireRole('EMPLOYEE'), asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity, location } = req.body as UpdateInventoryBody;
  const data: any = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (location !== undefined) {
    if (!Object.values(InventoryLocation).includes(location as any)) {
      res.status(400).json({ error: 'Invalid location' });
      return;
    }
    data.location = location;
  }
  const item = await prisma.inventoryItem.update({ where: { id: itemId }, data });
  res.json(item);
}));

export default router; 