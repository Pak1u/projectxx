import { Router, Request, Response } from 'express';
import { PrismaClient, Message } from '@prisma/client';
import requireAuth from './auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/messages/:userId
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const loggedInUserId = (req as any).user?.id;
  const otherUserId = req.params.userId;

  if (!loggedInUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const messages: Message[] = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: loggedInUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: loggedInUserId },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/partners
router.get('/partners', requireAuth, async (req: Request, res: Response) => {
  const loggedInUserId = (req as any).user?.id;
  if (!loggedInUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    // Find all assignments where user is vendor or employee
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { vendorId: loggedInUserId },
          { employeeId: loggedInUserId },
        ],
      },
    });
    // Collect partner userIds
    const partnerIds = assignments.map(a =>
      a.vendorId === loggedInUserId ? a.employeeId : a.vendorId
    );
    // Fetch partner user details
    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, email: true, role: true },
    });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

export default router; 