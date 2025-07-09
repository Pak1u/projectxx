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
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        <h2 className="text-3xl font-semibold mb-6">Vendor Dashboard</h2>
        <div className="w-full max-w-4xl space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Welcome, {user?.name || 'Vendor'}!</h3>
            <p className="text-gray-600 mb-4">Manage your inventory, view marketplace requests, and track your transactions.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
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
    </ProtectedRoute>
  );
} 