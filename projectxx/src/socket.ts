import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  socketId: string;
  online?: boolean;
  unreadCount: number;
  lastMessageTime: Date | null;
}

interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
}

const prisma = new PrismaClient();
const connectedUsers = new Map<string, User>();

export function setupSocketIO(io: Server) {
  io.on('connection', async (socket: Socket) => {
    // console.log('User connected:', socket.id);

    // Handle user connection
    socket.on('userConnected', async (userData: { email: string; name: string }) => {
      // console.log('User connected:', userData);
      
      // Get user from database to get proper data
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: {
          vendor: true,
          employee: true
        }
      });
      
      if (dbUser) {
        let name = dbUser.email;
        if (dbUser.vendor) {
          name = dbUser.vendor.name;
        } else if (dbUser.employee) {
          name = dbUser.employee.name;
        }
        
        const user: User = {
          id: dbUser.id,
          name: name,
          email: dbUser.email,
          role: dbUser.role,
          socketId: socket.id,
          online: true,
          unreadCount: 0,
          lastMessageTime: null
        };
        
        connectedUsers.set(userData.email, user);
        // console.log(`User ${userData.email} connected. Total connected users:`, connectedUsers.size);
      }
    });

    // Get available users
    socket.on('getAvailableUsers', async (data?: { currentUserEmail?: string }) => {
              // console.log('Getting available users. Connected users:', connectedUsers.size, 'Data:', data);
      
      try {
        // ALWAYS get ALL users from database, regardless of online status
        const dbUsers = await prisma.user.findMany({
          include: {
            vendor: true,
            employee: true
          }
        });

        // console.log('Raw database users:', dbUsers);

        // Create a map of online users for status checking
        const onlineUsers = new Map(Array.from(connectedUsers.entries()));
        
        // Get current user's email from the socket or from the data parameter
        let currentUserEmail = data?.currentUserEmail;
        if (!currentUserEmail) {
          currentUserEmail = Array.from(connectedUsers.values()).find(u => u.socketId === socket.id)?.email;
        }
        // console.log('Current user email determined:', currentUserEmail);
        
        // Process ALL database users, marking online status and getting unread counts
        const allUsers: User[] = await Promise.all(dbUsers.map(async (dbUser) => {
          const isOnline = onlineUsers.has(dbUser.email);
          const onlineUser = onlineUsers.get(dbUser.email);
          
          // Get name from vendor or employee, fallback to email
          let name = dbUser.email;
          if (dbUser.vendor) {
            name = dbUser.vendor.name;
          } else if (dbUser.employee) {
            name = dbUser.employee.name;
          }

          // Get unread message count from this user to current user
          let unreadCount = 0;
          let lastMessageTime = null;
          
          // console.log(`Checking unread condition: currentUserEmail=${currentUserEmail}, dbUser.email=${dbUser.email}, condition=${currentUserEmail && dbUser.email !== currentUserEmail}`);
          
          if (currentUserEmail && dbUser.email !== currentUserEmail) {
            const currentUser = await prisma.user.findUnique({ where: { email: currentUserEmail } });
            if (currentUser) {
              // Count all unread messages from this user to current user
              // console.log(`Querying for messages from ${dbUser.id} to ${currentUser.id}`);
              const unreadMessages = await prisma.message.findMany({
                where: {
                  senderId: dbUser.id,
                  receiverId: currentUser.id,
                  isRead: false
                },
                orderBy: {
                  timestamp: 'desc'
                }
              });
              
              // console.log(`Found ${unreadMessages.length} unread messages from ${dbUser.email} to ${currentUserEmail}`);
              // if (unreadMessages.length > 0) {
              //   console.log('Unread messages:', unreadMessages.map(m => ({ id: m.id, content: m.content, timestamp: m.timestamp })));
              // }
              
              unreadCount = unreadMessages.length;
              if (unreadMessages.length > 0) {
                lastMessageTime = unreadMessages[0].timestamp;
              }
              
              // console.log(`Checking unread messages from ${dbUser.email} to ${currentUserEmail}: found ${unreadCount} unread messages`);
            }
          }
          
          const user: User = {
            id: dbUser.id,
            name: name,
            email: dbUser.email,
            role: dbUser.role,
            socketId: onlineUser?.socketId || '',
            online: isOnline,
            unreadCount,
            lastMessageTime
          };
          
          // console.log(`Processing user: ${user.email} (${user.name}) - Role: ${user.role} - Online: ${user.online} - Unread: ${user.unreadCount} - LastMessage: ${user.lastMessageTime}`);
          return user;
        }));

        // Sort users by most recent message (unread first, then by last message time)
        allUsers.sort((a, b) => {
          // First sort by unread count (descending)
          if (a.unreadCount !== b.unreadCount) {
            return b.unreadCount - a.unreadCount;
          }
          // Then sort by last message time (descending)
          if (a.lastMessageTime && b.lastMessageTime) {
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          }
          // If no last message time, sort by name
          return a.name.localeCompare(b.name);
        });

        // console.log('Final users list being sent (ALL users):', allUsers);
        // console.log('Sending available users:', allUsers.length);
        const totalUnread = allUsers.reduce((sum, u) => sum + u.unreadCount, 0);
        // console.log('Total unread messages across all users:', totalUnread);
        socket.emit('availableUsers', allUsers);
      } catch (error) {
        console.error('Error fetching users from database:', error);
        console.error('Error details:', error);
        // Even in error case, try to send connected users
        const usersList = Array.from(connectedUsers.values());
        socket.emit('availableUsers', usersList);
      }
    });

    // Send private message
    socket.on('sendPrivateMessage', async (data: { senderEmail: string; receiverEmail: string; content: string }) => {
      // console.log('Sending private message:', data);
      
      try {
        const sender = await prisma.user.findUnique({ where: { email: data.senderEmail } });
        const receiver = await prisma.user.findUnique({ where: { email: data.receiverEmail } });
        
        if (!sender || !receiver) {
          console.error('Sender or receiver not found');
          return;
        }
        
        // Save message to database
        const message = await prisma.message.create({
          data: {
            senderId: sender.id,
            receiverId: receiver.id,
            content: data.content,
            isRead: false
          }
        });
        
        const roomId = [sender.id, receiver.id].sort().join('-');
        
        // Get socket IDs for sender and receiver
        const senderSocketId = Array.from(connectedUsers.values()).find(u => u.email === data.senderEmail)?.socketId;
        const receiverSocketId = Array.from(connectedUsers.values()).find(u => u.email === data.receiverEmail)?.socketId;
        
        // console.log(`Private message room: ${roomId}`);
        // console.log(`Sender socket: ${senderSocketId}, Receiver socket: ${receiverSocketId}`);
        
        // Emit to both users in the room
        io.to(roomId).emit('privateMessage', {
          id: message.id,
          senderEmail: data.senderEmail,
          receiverEmail: data.receiverEmail,
          content: data.content,
          timestamp: message.timestamp
        });
        
        // console.log(`Message sent to room: ${roomId} - Only sender and receiver should receive this`);
        
      } catch (error) {
        console.error('Error sending private message:', error);
      }
    });

    // Get conversation history
    socket.on('getConversationHistory', async (data: { user1Email: string; user2Email: string }) => {
      // console.log('Getting conversation history:', data);
      
      try {
        const user1 = await prisma.user.findUnique({ where: { email: data.user1Email } });
        const user2 = await prisma.user.findUnique({ where: { email: data.user2Email } });
        
        if (!user1 || !user2) {
          console.error('User not found');
          return;
        }
        
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: user1.id, receiverId: user2.id },
              { senderId: user2.id, receiverId: user1.id }
            ]
          },
          orderBy: {
            timestamp: 'asc'
          },
          include: {
            sender: true,
            receiver: true
          }
        });
        
        const conversationHistory = messages.map(msg => ({
          id: msg.id,
          senderEmail: msg.sender.email,
          receiverEmail: msg.receiver.email,
          content: msg.content,
          timestamp: msg.timestamp,
          isRead: msg.isRead
        }));
        
        socket.emit('conversationHistory', conversationHistory);
        
      } catch (error) {
        console.error('Error getting conversation history:', error);
      }
    });

    // Join private room
    socket.on('joinPrivateRoom', async (data: { senderEmail: string; receiverEmail: string }) => {
      // console.log('Joining private room:', data);
      
      try {
        const sender = await prisma.user.findUnique({ where: { email: data.senderEmail } });
        const receiver = await prisma.user.findUnique({ where: { email: data.receiverEmail } });
        
        if (!sender || !receiver) {
          console.error('Sender or receiver not found');
          return;
        }
        
        const roomId = [sender.id, receiver.id].sort().join('-');
        socket.join(roomId);
        // console.log(`User ${data.senderEmail} joined room: ${roomId}`);
        
        // Debug: Check who's in this room
        // const roomSockets = await io.in(roomId).fetchSockets();
        // console.log(`Room ${roomId} contains ${roomSockets.length} sockets:`, roomSockets.map(s => s.id));
        
        // Mark messages from receiver to sender as read
        await prisma.message.updateMany({
          where: {
            senderId: receiver.id,
            receiverId: sender.id,
            isRead: false
          },
          data: {
            isRead: true
          }
        });
        
        // Notify receiver that messages have been read
        const receiverSocketId = Array.from(connectedUsers.values()).find(u => u.email === data.receiverEmail)?.socketId;
        if (receiverSocketId) {
          // console.log(`Sending messagesRead to receiver ${data.receiverEmail} (socket: ${receiverSocketId})`);
          io.to(receiverSocketId).emit('messagesRead', { senderEmail: data.senderEmail });
        }
        
        // Notify sender to refresh their unread counts
        const senderSocketId = Array.from(connectedUsers.values()).find(u => u.email === data.senderEmail)?.socketId;
        if (senderSocketId) {
          // console.log(`Sending messagesRead to sender ${data.senderEmail} (socket: ${senderSocketId})`);
          io.to(senderSocketId).emit('messagesRead', { senderEmail: data.receiverEmail });
        }
        
      } catch (error) {
        console.error('Error joining private room:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      // Find and remove the disconnected user
      for (const [email, user] of connectedUsers.entries()) {
        if (user.socketId === socket.id) {
          connectedUsers.delete(email);
          // console.log(`User ${email} disconnected. Total connected users:`, connectedUsers.size);
          break;
        }
      }
    });

    // Transit-related events
    socket.on('joinTransitRoom', () => {
      socket.join('transit');
      console.log('User joined transit room');
    });

    socket.on('leaveTransitRoom', () => {
      socket.leave('transit');
      console.log('User left transit room');
    });

    // Marketplace-related events
    socket.on('joinMarketplaceRoom', () => {
      socket.join('marketplace');
      console.log('User joined marketplace room, socket ID:', socket.id);
    });

    socket.on('leaveMarketplaceRoom', () => {
      socket.leave('marketplace');
      console.log('User left marketplace room, socket ID:', socket.id);
    });
  });
}

// Transit event emitters
export function emitOfferAccepted(io: Server, itemRequest: any) {
  io.to('transit').emit('offerAccepted', {
    type: 'OFFER_ACCEPTED',
    itemRequest: {
      id: itemRequest.id,
      itemName: itemRequest.itemName,
      quantity: itemRequest.quantity,
      status: itemRequest.status,
      warehouse: itemRequest.warehouse,
      employee: itemRequest.employee,
      offers: itemRequest.offers,
      acceptanceTime: itemRequest.acceptanceTime
    }
  });
  console.log('Emitted offerAccepted event for request:', itemRequest.id);
}

export function emitTransitComplete(io: Server, itemRequestId: string) {
  io.to('transit').emit('transitComplete', {
    type: 'TRANSIT_COMPLETE',
    itemRequestId: itemRequestId
  });
  console.log('Emitted transitComplete event for request:', itemRequestId);
}

export function emitOfferCreated(io: Server, offer: any, itemRequest: any) {
  const eventData = {
    type: 'OFFER_CREATED',
    offer: {
      id: offer.id,
      quantity: offer.quantity,
      price: offer.price,
      status: offer.status,
      vendor: offer.vendor
    },
    itemRequest: {
      id: itemRequest.id,
      itemName: itemRequest.itemName,
      quantity: itemRequest.quantity,
      status: itemRequest.status,
      warehouse: itemRequest.warehouse,
      employee: itemRequest.employee
    }
  };
  
  console.log('Emitting offerCreated event to marketplace room:', eventData);
  io.to('marketplace').emit('offerCreated', eventData);
  console.log('Emitted offerCreated event for offer:', offer.id);
} 