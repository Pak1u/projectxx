"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Employee Dashboard</h2>
        <div className="w-full max-w-4xl space-y-8">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-green-500 p-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
                <span className="text-2xl font-bold text-blue-600">{user?.name?.charAt(0).toUpperCase() || 'E'}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Welcome, <span className="underline decoration-green-200 decoration-4">{user?.name || 'Employee'}</span>!</h3>
                <p className="text-blue-100">Manage warehouse inventory, create requests, and track transactions for your warehouse.</p>
              </div>
            </div>
          </div>
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
            <div className="p-6 pb-2">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4" /></svg>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <a 
                  href="/marketplace" 
                  className="flex flex-col items-center justify-center bg-blue-600 text-white px-4 py-5 rounded-xl shadow hover:bg-blue-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span className="font-semibold">Marketplace</span>
                </a>
                <a 
                  href="/employee/warehouse" 
                  className="flex flex-col items-center justify-center bg-green-600 text-white px-4 py-5 rounded-xl shadow hover:bg-green-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" /></svg>
                  <span className="font-semibold">Warehouse</span>
                </a>
                <a 
                  href="/employee/request" 
                  className="flex flex-col items-center justify-center bg-purple-600 text-white px-4 py-5 rounded-xl shadow hover:bg-purple-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="font-semibold">Create Request</span>
                </a>
                <a 
                  href="/transit" 
                  className="flex flex-col items-center justify-center bg-orange-600 text-white px-4 py-5 rounded-xl shadow hover:bg-orange-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-semibold">Transit</span>
                </a>
                <a 
                  href="/employee/billing" 
                  className="flex flex-col items-center justify-center bg-indigo-600 text-white px-4 py-5 rounded-xl shadow hover:bg-indigo-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-semibold">Billings</span>
                </a>
                <a 
                  href="/employee/profile" 
                  className="flex flex-col items-center justify-center bg-gray-600 text-white px-4 py-5 rounded-xl shadow hover:bg-gray-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" /></svg>
                  <span className="font-semibold">Profile</span>
                </a>
                <a 
                  href="/employee/assign-trucks" 
                  className="flex flex-col items-center justify-center bg-teal-600 text-white px-4 py-5 rounded-xl shadow hover:bg-teal-700 transition-all group"
                >
                  <svg className="w-7 h-7 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-semibold">Assign Trucks</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 
