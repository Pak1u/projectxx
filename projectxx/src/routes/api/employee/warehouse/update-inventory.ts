import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth, requireRole } from '../../../../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

// PUT /api/employee/warehouse/update-inventory - Update warehouse inventory
router.put('/', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { inventory } = req.body;

    if (!inventory || !Array.isArray(inventory)) {
      res.status(400).json({ error: 'Invalid inventory data' });
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

    // Update each inventory item
    for (const item of inventory) {
      await prisma.warehouseInventory.updateMany({
        where: {
          warehouseId: employee.warehouseId,
          itemName: item.name,
        },
        data: {
          quantity: item.quantity,
        },
      });
    }

    res.json({ message: 'Inventory updated successfully' });
    return;
  } catch (error) {
    console.error('Error updating warehouse inventory:', error);
    res.status(500).json({ error: 'Failed to update warehouse inventory' });
    return;
  }
});

export default router; 