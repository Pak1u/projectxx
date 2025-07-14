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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Vendor Dashboard</h2>
        <div className="w-full max-w-4xl space-y-8">
          <div className="bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-2xl">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Welcome, {user?.name || 'Vendor'}!</h3>
                <p className="text-blue-100">Manage your inventory, view marketplace requests, and track your transactions.</p>
              </div>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="/marketplace" 
                    className="block bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 text-center transition-colors"
                  >
                    View Marketplace
                  </a>
                  <a 
                    href="/vendor/inventory" 
                    className="block bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 text-center transition-colors"
                  >
                    Manage Inventory
                  </a>
                  <a 
                    href="/transit" 
                    className="block bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 text-center transition-colors"
                  >
                    View Transit
                  </a>
                  <a 
                    href="/vendor/billing" 
                    className="block bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 text-center transition-colors"
                  >
                    View Billings
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 