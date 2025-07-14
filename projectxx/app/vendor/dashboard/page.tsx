"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

const API_BASE = 'http://localhost:4000';

export default function VendorDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <ProtectedRoute requiredRole="VENDOR">
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-100 via-orange-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-200 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Vendor Dashboard</h2>
        <div className="w-full max-w-4xl space-y-10">
          {/* Welcome Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-purple-100">
            <div className="flex items-center bg-gradient-to-r from-purple-600 to-orange-500 p-8">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl mr-6">
                <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Welcome, <span className="underline decoration-orange-200 decoration-4">{user?.name || 'Vendor'}</span>!</h3>
                <p className="text-purple-100">Manage your inventory, view marketplace requests, and track your transactions.</p>
              </div>
            </div>
          </div>
          {/* Quick Actions Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-purple-100">
            <div className="p-8 pb-2">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4" /></svg>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                <a 
                  href="/marketplace" 
                  className="flex flex-col items-center justify-center bg-purple-600 text-white px-4 py-5 rounded-xl shadow hover:bg-purple-700 transition-all group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span className="font-semibold">Marketplace</span>
                </a>
                <a 
                  href="/vendor/inventory" 
                  className="flex flex-col items-center justify-center bg-orange-600 text-white px-4 py-5 rounded-xl shadow hover:bg-orange-700 transition-all group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" /></svg>
                  <span className="font-semibold">Inventory</span>
                </a>
                <a 
                  href="/transit" 
                  className="flex flex-col items-center justify-center bg-blue-600 text-white px-4 py-5 rounded-xl shadow hover:bg-blue-700 transition-all group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-semibold">Transit</span>
                </a>
                <a 
                  href="/vendor/billing" 
                  className="flex flex-col items-center justify-center bg-green-600 text-white px-4 py-5 rounded-xl shadow hover:bg-green-700 transition-all group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-semibold">Billings</span>
                </a>
                <a 
                  href="/vendor/profile" 
                  className="flex flex-col items-center justify-center bg-purple-500 text-white px-4 py-5 rounded-xl shadow hover:bg-purple-600 transition-all group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" /></svg>
                  <span className="font-semibold">Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 