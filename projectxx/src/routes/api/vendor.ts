/// <reference path="../../types/express/index.d.ts" />
import { Router, Request, Response } from 'express';
import { authenticateToken, requireAuth, requireRole } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

router.get('/dashboard', authenticateToken, requireAuth, requireRole('VENDOR'), (req, res) => {
  res.json({ message: 'Vendor dashboard' });
});

router.get('/inventory', authenticateToken, requireAuth, requireRole('VENDOR'), async (req: Request, res: Response): Promise<void> => {
  const vendorUserId = req.user?.userId;
  const itemName = req.query.itemName as string | undefined;
  try {
    // Find the vendor by userId
    const vendor = await prisma.vendor.findFirst({ where: { user: { id: vendorUserId } } });
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    const where = { vendorId: vendor.id } as any;
    if (itemName) where.itemName = itemName;
    const inventory = await prisma.vendorInventory.findMany({ where });
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor inventory', details: err });
  }
});

router.get('/billings', authenticateToken, requireAuth, requireRole('VENDOR'), async (req: Request, res: Response): Promise<void> => {
  const vendorUserId = req.user?.userId;
  try {
    // Find the vendor by userId
    const vendor = await prisma.vendor.findFirst({ where: { user: { id: vendorUserId } } });
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    // Get billing records where this vendor has accepted offers
    const billings = await prisma.billingRecord.findMany({
      where: {
        itemRequest: {
          offers: {
            some: {
              vendorId: vendor.id,
              status: 'ACCEPTED'
            }
          }
        }
      },
      include: {
        warehouse: true,
        itemRequest: {
          include: {
            employee: true,
            offers: {
              where: {
                vendorId: vendor.id,
                status: 'ACCEPTED'
              },
              include: {
                vendor: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    res.json(billings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor billings', details: err });
  }
});

export default router; 