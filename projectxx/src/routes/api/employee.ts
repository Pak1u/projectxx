import { Router, Request, Response } from 'express';
import { authenticateToken, requireAuth, requireRole } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/dashboard', authenticateToken, requireAuth, requireRole('EMPLOYEE'), (req, res) => {
  res.json({ message: 'Employee dashboard' });
});

router.get('/profile', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const employee = await prisma.walmartEmployee.findFirst({
      where: { user: { id: userId } },
      include: { warehouse: true },
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee profile', details: err });
  }
});

router.get('/billing', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const employee = await prisma.walmartEmployee.findFirst({
      where: { user: { id: req.user.userId } },
    });
    if (!employee || !employee.warehouseId) {
      res.status(403).json({ error: 'Employee not assigned to a warehouse' });
      return;
    }
    const billings = await prisma.billingRecord.findMany({
      where: { warehouseId: employee.warehouseId },
      include: {
        itemRequest: true,
        warehouse: true,
        generatedBy: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
    res.json({ billings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch billing records', details: err });
  }
});

router.get('/warehouse-inventory', authenticateToken, requireAuth, requireRole('EMPLOYEE'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const employee = await prisma.walmartEmployee.findFirst({
      where: { user: { id: req.user.userId } },
    });
    if (!employee || !employee.warehouseId) {
      res.status(403).json({ error: 'Employee not assigned to a warehouse' });
      return;
    }
    
    const inventory = await prisma.warehouseInventory.findMany({
      where: { warehouseId: employee.warehouseId },
      orderBy: { itemName: 'asc' },
    });
    
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warehouse inventory', details: err });
  }
});

export default router; 