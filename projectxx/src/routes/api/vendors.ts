import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAuth } from '../../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

// GET /api/vendors - Get all vendors
router.get('/', authenticateToken, requireAuth, async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            email: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

export default router; 