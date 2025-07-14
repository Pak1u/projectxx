"use client";

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
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
      const filteredUsers = usersList.filter(u => u.email !== user.email);
      const hasUnread = filteredUsers.some(u => u.unreadCount > 0);
      setHasUnreadMessages(hasUnread);
    });

    newSocket.on('privateMessage', (message: any) => {
      if (message.receiverEmail === user.email) {
        newSocket.emit('getAvailableUsers', { currentUserEmail: user.email });
      }
    });

    newSocket.on('messagesRead', (data: any) => {
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

  useEffect(() => {
    if (socket && user) {
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

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-200 w-full">
      <div className="w-full flex items-center h-20 px-4">
        {/* Left Side - Logo Only, with small left margin */}
        <div className="flex items-center pl-0 mr-2">
          <Link href="/" className="flex items-center space-x-3 group pl-0 ml-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              {/* Walmart Logo */}
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Walmart
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Inventory Management</p>
            </div>
          </Link>
        </div>

        {/* Center Navigation - Essential Links + Assign Trucks + More, centered horizontally */}
        <div className="flex-1 flex items-center justify-center space-x-2">
          {user ? (
            <>
              {user.role === 'ADMIN' ? (
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className={`group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/admin/dashboard') 
                        ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/messages" 
                    className={`relative group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/messages') 
                        ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Messages</span>
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center animate-pulse"></span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  {/* Essential Navigation */}
                  <Link 
                    href="/messages" 
                    className={`relative group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/messages') 
                        ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Messages</span>
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center animate-pulse"></span>
                    )}
                  </Link>

                  <Link 
                    href="/marketplace" 
                    className={`group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/marketplace') 
                        ? 'text-green-600 bg-green-50 border border-green-200 shadow-sm' 
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Marketplace</span>
                  </Link>

                  <Link 
                    href="/transit" 
                    className={`group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/transit') 
                        ? 'text-orange-600 bg-orange-50 border border-orange-200 shadow-sm' 
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Transit</span>
                  </Link>

                  <Link 
                    href={user.role === 'VENDOR' ? '/vendor/dashboard' : '/employee/dashboard'} 
                    className={`group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      isActive('/vendor/dashboard') || isActive('/employee/dashboard') 
                        ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>

                  {/* Assign Trucks Button - Only for Employees */}
                  {user.role === 'EMPLOYEE' && user.employee?.warehouseId && (
                    <Link 
                      href="/employee/assign-trucks" 
                      className={`group px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                        isActive('/employee/assign-trucks') 
                          ? 'text-teal-600 bg-teal-50 border border-teal-200 shadow-sm' 
                          : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Assign Trucks</span>
                    </Link>
                  )}

                  {/* More Options Dropdown as a button in center nav */}
                  <div className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>More</span>
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="py-2">
                        {/* Employee-specific options */}
                        {user.role === 'EMPLOYEE' && user.employee?.warehouseId && (
                          <>
                            <Link 
                              href="/employee/billing" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/employee/billing') ? 'text-green-600 bg-green-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Billings</span>
                            </Link>

                            <Link 
                              href="/employee/warehouse" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/employee/warehouse') ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Warehouse</span>
                            </Link>

                            <Link 
                              href="/employee/route-planner" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/employee/route-planner') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Route Planner</span>
                            </Link>

                            <Link 
                              href="/employee/request" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/employee/request') ? 'text-orange-600 bg-orange-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>Request</span>
                            </Link>
                          </>
                        )}

                        {/* Vendor-specific options */}
                        {user.role === 'VENDOR' && (
                          <>
                            <Link 
                              href="/vendor/billing" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/vendor/billing') ? 'text-green-600 bg-green-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Billings</span>
                            </Link>

                            <Link 
                              href="/vendor/inventory" 
                              className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                                isActive('/vendor/inventory') ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span>Inventory</span>
                            </Link>
                          </>
                        )}

                        {/* Friends link for all users */}
                        <Link 
                          href="/friends" 
                          className={`flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                            isActive('/friends') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span>Friends</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* Right Side - Combined Profile/Logout, with small right margin */}
        <div className="flex items-center pl-2">
          {user ? (
            <div className="flex items-stretch h-12">
              <Link 
                href={user.role === 'ADMIN' ? '/admin/profile' : user.role === 'EMPLOYEE' ? '/employee/profile' : '/vendor/profile'}
                className={`flex items-center space-x-3 px-4 h-full rounded-l-lg border-l border-y transition-all duration-300 group ${
                  isActive('/admin/profile') || isActive('/employee/profile') || isActive('/vendor/profile')
                    ? 'bg-gradient-to-r from-blue-100 to-green-100 border-blue-300 shadow-sm'
                    : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <span className="text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{user.name}</span>
                  <span className="text-xs text-gray-600 capitalize">{user.role.toLowerCase()}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="group px-3 h-full rounded-r-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center space-x-1 shadow-lg hover:shadow-xl border-r border-y border-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className="group px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </Link>

              <Link 
                href="/register" 
                className="group px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Sign Up</span>
              </Link>

              <Link
                href="/admin/login"
                className="group px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Admin</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 

