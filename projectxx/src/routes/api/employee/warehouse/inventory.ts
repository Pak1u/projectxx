import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

// GET /api/employee/warehouse/inventory - Get warehouse inventory for employee
router.get('/', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get employee's warehouse
    const employee = await prisma.walmartEmployee.findFirst({
      where: { user: { id: req.user.userId } },
      include: { warehouse: true },
    });

    if (!employee || !employee.warehouseId) {
      res.status(403).json({ error: 'Employee not assigned to a warehouse' });
      return;
    }

    // Get warehouse inventory
    const inventory = await prisma.warehouseInventory.findMany({
      where: { warehouseId: employee.warehouseId },
      orderBy: { itemName: 'asc' },
    });

    // Convert to the format expected by frontend
    const formattedInventory = inventory.map(item => ({
      id: item.id, // Keep as string since that's how it's stored in DB
      name: item.itemName,
      quantity: item.quantity,
      price: 0, // Warehouse inventory doesn't have prices, but frontend expects this field
    }));

    res.json(formattedInventory);
    return;
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse inventory' });
    return;
  }
});

export default router; 