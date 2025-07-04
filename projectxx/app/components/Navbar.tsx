"use client";

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  socketId: string;
  online: boolean;
  unreadCount: number;
  lastMessageTime: Date | null;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('userConnected', { email: user.email, name: user.name });
    });

    newSocket.on('availableUsers', (usersList: User[]) => {
      // console.log('Navbar received users:', usersList);
      const filteredUsers = usersList.filter(u => u.email !== user.email);
      // console.log('Filtered users:', filteredUsers);
      // Check if any user has unread messages (same logic as messages page)
      const hasUnread = filteredUsers.some(u => u.unreadCount > 0);
      // console.log('Navbar - Has unread messages:', hasUnread, 'Users with unread:', filteredUsers.filter(u => u.unreadCount > 0).map(u => `${u.name}(${u.unreadCount})`));
      setHasUnreadMessages(hasUnread);
    });

    newSocket.on('privateMessage', (message: any) => {
      if (message.receiverEmail === user.email) {
        // Refresh the count when a new message is received
        newSocket.emit('getAvailableUsers', { currentUserEmail: user.email });
      }
    });

    newSocket.on('messagesRead', (data: any) => {
      // console.log('Navbar received messagesRead event:', data);
      // Refresh count when messages are read
      newSocket.emit('getAvailableUsers', { currentUserEmail: user.email });
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    if (socket && user) {
      socket.emit('getAvailableUsers', { currentUserEmail: user.email });
    }
  }, [socket, user]);

  // Refresh unread counts periodically and when user interacts with messages
  useEffect(() => {
    if (socket && user) {
      // Refresh every 2 seconds to stay in sync
      const interval = setInterval(() => {
        socket.emit('getAvailableUsers', { currentUserEmail: user.email });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [socket, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Walmart Inventory Manager
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  href="/messages" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium relative"
                >
                  Messages
                  {hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3"></span>
                  )}
                </Link>
                <Link 
                  href={user.role === 'VENDOR' ? '/vendor/dashboard' : '/employee/dashboard'} 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 text-sm">{user.name}</span>
                  <span className="text-gray-500 text-sm">({user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 