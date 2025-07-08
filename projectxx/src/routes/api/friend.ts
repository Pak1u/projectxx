import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// POST /api/friend/request - Send a friend request using receiver's friendKey
router.post('/request', requireAuth, async (req: Request, res: Response) => {
  const senderId = (req as any).user?.id;
  const { friendKey } = req.body;
  if (!senderId || !friendKey) {
    res.status(400).json({ error: 'Missing sender or friendKey' });
    return;
  }
  try {
    const receiver = await prisma.user.findUnique({ where: { friendKey } });
    if (!receiver) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (receiver.id === senderId) {
      res.status(400).json({ error: 'Cannot send request to yourself' });
      return;
    }
    // Check if request already exists
    const existing = await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId, receiverId: receiver.id } } });
    if (existing) {
      res.status(409).json({ error: 'Request already sent' });
      return;
    }
    await prisma.friendRequest.create({ data: { senderId, receiverId: receiver.id, status: 'PENDING' } });
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request', details: err });
  }
});

// POST /api/friend/accept - Accept a friend request
router.post('/accept', requireAuth, async (req: Request, res: Response) => {
  const receiverId = (req as any).user?.id;
  const { requestId } = req.body;
  if (!receiverId || !requestId) {
    res.status(400).json({ error: 'Missing receiver or requestId' });
    return;
  }
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== receiverId) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Request already handled' });
      return;
    }
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request', details: err });
  }
});

// POST /api/friend/decline - Decline a friend request
router.post('/decline', requireAuth, async (req: Request, res: Response) => {
  const receiverId = (req as any).user?.id;
  const { requestId } = req.body;
  if (!receiverId || !requestId) {
    res.status(400).json({ error: 'Missing receiver or requestId' });
    return;
  }
  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== receiverId) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Request already handled' });
      return;
    }
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'DECLINED' } });
    res.json({ message: 'Friend request declined' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline request', details: err });
  }
});

// GET /api/friend/requests - Get all pending friend requests for the logged-in user
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: { sender: { select: { id: true, email: true, friendKey: true } } }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests', details: err });
  }
});

// GET /api/friend/list - Get all accepted friends for the logged-in user
router.get('/list', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const sent = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'ACCEPTED' },
      include: { receiver: { select: { id: true, email: true, friendKey: true } } }
    });
    const received = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'ACCEPTED' },
      include: { sender: { select: { id: true, email: true, friendKey: true } } }
    });
    const friends = [
      ...sent.map(r => r.receiver),
      ...received.map(r => r.sender)
    ];
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends', details: err });
  }
});

export default router; 