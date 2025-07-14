"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';

const API_BASE = 'http://localhost:4000';

export default function EmployeeWarehousePage() {
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [minPredictions, setMinPredictions] = useState<{ [itemName: string]: number }>({});

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchWarehouseInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/api/employee/warehouse-inventory`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch warehouse inventory');
      const data = await res.json();
      setWarehouseInventory(data.inventory || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch minimum predictions in parallel
  const fetchMinPredictions = async (items: any[]) => {
    const promises = items.map((item: any) =>
      fetch(`http://localhost:8000/predict?item_name=${encodeURIComponent(item.itemName.toLowerCase())}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );
    const results = await Promise.all(promises);
    const minMap: { [itemName: string]: number } = {};
    results.forEach((result, idx) => {
      if (result && typeof result.predicted_quantity_2024 === 'number') {
        minMap[items[idx].itemName.toLowerCase()] = result.predicted_quantity_2024;
      }
    });
    setMinPredictions(minMap);
  };

  useEffect(() => {
    fetchWarehouseInventory();
  }, []);

  // Fetch minimums after inventory loads
  useEffect(() => {
    if (warehouseInventory.length > 0) {
      fetchMinPredictions(warehouseInventory);
    }
  }, [warehouseInventory]);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Warehouse Inventory</h2>
        {loading ? (
          <p>Loading warehouse inventory...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : warehouseInventory.length === 0 ? (
          <p>No inventory items found in warehouse.</p>
        ) : (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-teal-500 p-6 rounded-t-2xl">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Warehouse Stock</h3>
                <p className="text-blue-100">Current inventory and minimum predictions</p>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouseInventory.map((item: any) => {
                  const minQty = minPredictions[item.itemName.toLowerCase()];
                  const isBelowMin = minQty !== undefined && item.quantity < minQty;
                  const minColor = minQty === undefined ? 'text-gray-500' : isBelowMin ? 'text-red-600' : 'text-green-600';
                  return (
                    <div key={item.id} className="border rounded-xl p-6 bg-gray-50 hover:shadow-lg transition-shadow flex flex-col items-start">
                      <div className="font-semibold text-lg mb-2 text-blue-900">{item.itemName}</div>
                      <div className="text-gray-700 mb-1">Quantity: <span className="font-bold text-blue-700">{item.quantity}</span></div>
                      <div className={minColor + " font-medium"}>
                        Minimum Needed: {minQty !== undefined ? minQty : 'Loading...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 