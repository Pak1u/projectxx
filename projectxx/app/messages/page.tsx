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
      // console.log('Received users:', usersList);
      // Filter out current user
      const filteredUsers = usersList.filter(u => u.email !== user.email);
      setUsers(filteredUsers);
      
      // Calculate total unread count
      const total = filteredUsers.reduce((sum, u) => sum + u.unreadCount, 0);
      // console.log('Total unread count:', total);
      // console.log('Users with unread messages:', filteredUsers.filter(u => u.unreadCount > 0).map(u => `${u.name} (${u.unreadCount})`));
      setTotalUnreadCount(total);
      
      // Check for pending chat parameter and pre-select user
      if (pendingChatParam.current && !selectedUser) {
        const targetUser = filteredUsers.find(u => u.email === pendingChatParam.current);
        if (targetUser) {
          console.log('Auto-selecting user from URL parameter:', targetUser.email);
          // Add a small delay to ensure socket is ready
          setTimeout(() => {
            handleUserSelect(targetUser);
            pendingChatParam.current = null; // Clear the pending parameter
          }, 100);
        }
      }
    });

    newSocket.on('privateMessage', (message: Message) => {
      // console.log('Received private message:', message);
      
      // Add message to chat if it's specifically between current user and selected user
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && 
          ((message.senderEmail === user.email && message.receiverEmail === currentSelectedUser.email) ||
           (message.senderEmail === currentSelectedUser.email && message.receiverEmail === user.email))) {
        // console.log('Adding message to chat:', message.content, 'between', user.email, 'and', currentSelectedUser.email);
        setMessages(prev => [...prev, message]);
      } else {
        // console.log('Ignoring message:', message.content, 'not between', user.email, 'and', currentSelectedUser?.email);
      }
      
      // Update unread count for the sender
      setUsers(prev => {
        const updatedUsers = prev.map(u => {
          if (u.email === message.senderEmail && message.receiverEmail === user.email) {
            return { ...u, unreadCount: u.unreadCount + 1 };
          }
          return u;
        });
        
        // Recalculate total unread count
        const total = updatedUsers.reduce((sum, u) => sum + u.unreadCount, 0);
        setTotalUnreadCount(total);
        return updatedUsers;
      });
    });

    newSocket.on('messagesRead', (data: { senderEmail: string }) => {
      // console.log('Messages read from:', data.senderEmail);
      // Update unread count when messages are read
      setUsers(prev => prev.map(u => {
        if (u.email === data.senderEmail) {
          return { ...u, unreadCount: 0 };
        }
        return u;
      }));
      
      // Recalculate total unread count
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
      // console.log('Received conversation history:', history);
      setMessages(history);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Removed duplicate getAvailableUsers call since it's now called in the connect event

  // Retry auto-selection if users are loaded but we still have a pending chat parameter
  useEffect(() => {
    if (users.length > 0 && pendingChatParam.current && !selectedUser && socket) {
      const targetUser = users.find(u => u.email === pendingChatParam.current);
      if (targetUser) {
        console.log('Retrying auto-selection for user:', targetUser.email);
        // Add a small delay to ensure everything is ready
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
    console.log('handleUserSelect called for:', selectedUser.email);
    setSelectedUser(selectedUser);
    setMessages([]);
    
    // Remove blue dot from the selected user immediately
    setUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.email === selectedUser.email) {
          return { ...u, unreadCount: 0 };
        }
        return u;
      });
      
      // Recalculate total unread count
      const total = updatedUsers.reduce((sum, u) => sum + u.unreadCount, 0);
      setTotalUnreadCount(total);
      return updatedUsers;
    });
    
    if (socket && user) {
      console.log('Joining private room and getting conversation history for:', selectedUser.email);
      // Join private room and mark messages as read
      socket.emit('joinPrivateRoom', { 
        senderEmail: user.email, 
        receiverEmail: selectedUser.email 
      });
      
      // Get conversation history
      socket.emit('getConversationHistory', {
        user1Email: user.email,
        user2Email: selectedUser.email
      });
    } else {
      console.log('Socket or user not ready. Socket:', !!socket, 'User:', !!user);
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
    return <div className="flex justify-center items-center h-screen">Please log in to access messages.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          {totalUnreadCount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {totalUnreadCount} unread
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {users.map((userItem) => (
            <div
              key={userItem.id}
              onClick={() => handleUserSelect(userItem)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedUser?.email === userItem.email ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${
                      userItem.online ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    {userItem.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{userItem.name}</div>
                    <div className="text-sm text-gray-500">{userItem.role}</div>
                  </div>
                </div>
                {userItem.unreadCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {userItem.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedUser.online ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div>
                  <div className="font-semibold text-gray-900">{selectedUser.name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.role}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderEmail === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderEmail === user.email
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.senderEmail === user.email ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
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
      </div>
    </div>
  );
} 