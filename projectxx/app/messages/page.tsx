"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import { useSearchParams } from 'next/navigation';

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

interface Message {
  id: string;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [socket, setSocket] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<User | null>(null);
  const pendingChatParam = useRef<string | null>(null);

  // Update ref when selectedUser changes
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Check for chat parameter on mount and when user loads
  useEffect(() => {
    if (user) {
      const chatParam = searchParams.get('chat');
      if (chatParam) {
        pendingChatParam.current = chatParam;
        console.log('Chat parameter found:', chatParam);
      }
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('userConnected', { email: user.email, name: user.name });
      
      // Small delay to ensure connection is fully established
      setTimeout(() => {
        newSocket.emit('getAvailableUsers', { currentUserEmail: user.email });
      }, 100);
    });

    newSocket.on('availableUsers', (usersList: User[]) => {
      // Filter out current user
      const filteredUsers = usersList.filter(u => u.email !== user.email);
      setUsers(filteredUsers);
      
      // Calculate total unread count
      const total = filteredUsers.reduce((sum, u) => sum + u.unreadCount, 0);
      setTotalUnreadCount(total);
      
      // Check for pending chat parameter and pre-select user
      if (pendingChatParam.current && !selectedUser) {
        const targetUser = filteredUsers.find(u => u.email === pendingChatParam.current);
        if (targetUser) {
          setTimeout(() => {
            handleUserSelect(targetUser);
            pendingChatParam.current = null; // Clear the pending parameter
          }, 100);
        }
      }
    });

    newSocket.on('privateMessage', (message: Message) => {
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && 
          ((message.senderEmail === user.email && message.receiverEmail === currentSelectedUser.email) ||
           (message.senderEmail === currentSelectedUser.email && message.receiverEmail === user.email))) {
        setMessages(prev => [...prev, message]);
      }
      setUsers(prev => {
        const updatedUsers = prev.map(u => {
          if (u.email === message.senderEmail && message.receiverEmail === user.email) {
            return { ...u, unreadCount: u.unreadCount + 1 };
          }
          return u;
        });
        const total = updatedUsers.reduce((sum, u) => sum + u.unreadCount, 0);
        setTotalUnreadCount(total);
        return updatedUsers;
      });
    });

    newSocket.on('messagesRead', (data: { senderEmail: string }) => {
      setUsers(prev => prev.map(u => {
        if (u.email === data.senderEmail) {
          return { ...u, unreadCount: 0 };
        }
        return u;
      }));
      setUsers(prev => {
        const updatedUsers = prev.map(u => {
          if (u.email === data.senderEmail) {
            return { ...u, unreadCount: 0 };
          }
          return u;
        });
        const total = updatedUsers.reduce((sum, u) => sum + u.unreadCount, 0);
        setTotalUnreadCount(total);
        return updatedUsers;
      });
    });

    newSocket.on('conversationHistory', (history: Message[]) => {
      setMessages(history);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    if (users.length > 0 && pendingChatParam.current && !selectedUser && socket) {
      const targetUser = users.find(u => u.email === pendingChatParam.current);
      if (targetUser) {
        setTimeout(() => {
          handleUserSelect(targetUser);
          pendingChatParam.current = null;
        }, 200);
      }
    }
  }, [users, selectedUser, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setMessages([]);
    setUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.email === selectedUser.email) {
          return { ...u, unreadCount: 0 };
        }
        return u;
      });
      const total = updatedUsers.reduce((sum, u) => sum + u.unreadCount, 0);
      setTotalUnreadCount(total);
      return updatedUsers;
    });
    if (socket && user) {
      socket.emit('joinPrivateRoom', { 
        senderEmail: user.email, 
        receiverEmail: selectedUser.email 
      });
      socket.emit('getConversationHistory', {
        user1Email: user.email,
        user2Email: selectedUser.email
      });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !socket || !user) return;
    const messageData = {
      senderEmail: user.email,
      receiverEmail: selectedUser.email,
      content: newMessage
    };
    socket.emit('sendPrivateMessage', messageData);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-white">Please log in to access messages.</div>;
  }

  // Helper: Split users by role
  const vendors = users.filter(u => u.role.toLowerCase() === 'vendor');
  const employees = users.filter(u => u.role.toLowerCase().includes('employee'));

  return (
    <div className="flex min-h-screen h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-neutral-100 relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-white/80 border-r border-gray-200 flex flex-col shadow-2xl z-10 h-full backdrop-blur-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-wide mb-2">Chat</h2>
        </div>
        {/* Vendors Section (only if vendors exist) */}
        {vendors.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Vendors</h3>
            <ul className="space-y-2">
              {vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition
                    ${selectedUser?.id === vendor.id ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-blue-50'}
                  `}
                  onClick={() => handleUserSelect(vendor)}
                >
                  <span className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {vendor.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-gray-800 font-medium">{vendor.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {employees.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">Employees</h3>
            <ul className="space-y-2">
              {employees.map((employee) => (
                <li
                  key={employee.id}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition
                    ${selectedUser?.id === employee.id ? 'bg-purple-100 border-l-4 border-purple-500' : 'hover:bg-purple-50'}
                  `}
                  onClick={() => handleUserSelect(employee)}
                >
                  <span className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-gray-800 font-medium">{employee.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-neutral-100 relative">
        {selectedUser ? (
          <>
            {/* Stylish Chat Header */}
            <header className="flex items-center gap-4 px-8 py-5 bg-white/80 border-b border-gray-200 shadow-md backdrop-blur-md sticky top-0 z-10 rounded-b-3xl">
              <div className="relative">
                {/* Profile Picture or Initials */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-purple-300 to-neutral-200 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                  selectedUser.online ? 'bg-green-500' : 'bg-gray-300'
                }`}></span>
              </div>
              <div>
                <div className="font-bold text-blue-900 text-xl tracking-wide flex items-center gap-2">
                  {selectedUser.name}
                  <span className={`ml-2 text-xs font-semibold ${selectedUser.online ? 'text-green-600' : 'text-gray-400'}`}>{selectedUser.online ? 'Online' : 'Offline'}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{selectedUser.role}</div>
              </div>
            </header>

            {/* Messages Section with Elegant Background */}
            <section className="flex-1 overflow-y-auto px-8 py-8 space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-neutral-100" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(180,180,255,0.08) 0, transparent 70%)'}}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderEmail === user.email ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                >
                  <div
                    className={`max-w-lg px-6 py-3 rounded-3xl shadow-lg transition-all duration-200 text-base leading-relaxed ${
                      message.senderEmail === user.email
                        ? 'bg-gradient-to-br from-blue-500 via-blue-400 to-purple-400 text-white rounded-br-xl'
                        : 'bg-white/80 text-gray-900 rounded-bl-xl border border-gray-100'
                    }`}
                  >
                    {message.content}
                    <div className={`text-xs mt-2 text-right ${
                      message.senderEmail === user.email ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </section>

            {/* Chat Typing Input Area as Card */}
            <footer className="px-8 py-6 bg-transparent flex-shrink-0">
              <div className="flex items-end gap-3 bg-white/90 rounded-2xl shadow-xl px-6 py-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border-none bg-transparent focus:outline-none text-base resize-none placeholder-gray-400"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="flex items-center justify-center px-5 py-2 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-400 text-white rounded-xl shadow hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a user from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 