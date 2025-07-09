"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';

const API_BASE = 'http://localhost:4000';

export default function VendorInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchVendorInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/api/vendor/inventory`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch vendor inventory');
      const data = await res.json();
      setInventory(data.inventory || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorInventory();
  }, []);

  return (
    <ProtectedRoute requiredRole="VENDOR">
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        <h2 className="text-3xl font-semibold mb-6">Vendor Inventory</h2>
        {loading ? (
          <p>Loading inventory...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : inventory.length === 0 ? (
          <p>No inventory items found.</p>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Your Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="font-semibold text-lg mb-2">{item.itemName}</div>
                    <div className="text-gray-600 mb-1">Quantity: <span className="font-medium">{item.quantity}</span></div>
                    <div className="text-gray-600">Price: <span className="font-medium text-green-600">${item.price.toFixed(2)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 