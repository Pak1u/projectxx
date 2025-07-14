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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Warehouse Inventory</h2>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 text-lg">Loading warehouse inventory...</span>
          </div>
        ) : error ? (
          <p className="text-red-500 text-lg font-semibold">{error}</p>
        ) : warehouseInventory.length === 0 ? (
          <p className="text-gray-600 text-lg">No inventory items found in warehouse.</p>
        ) : (
          <div className="w-full max-w-5xl">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-blue-100">
              <div className="flex items-center bg-gradient-to-r from-blue-600 to-green-500 p-8">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl mr-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Warehouse Stock</h3>
                  <p className="text-blue-100">View and monitor your warehouse inventory and minimum requirements.</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {warehouseInventory.map((item: any) => {
                  const minQty = minPredictions[item.itemName?.toLowerCase()];
                  const isBelowMin = minQty !== undefined && item.quantity < minQty;
                  const minColor = minQty === undefined ? 'text-gray-500' : isBelowMin ? 'text-red-600' : 'text-green-600';
                  const cardBorder = isBelowMin ? 'border-red-300' : 'border-green-200';
                  return (
                    <div key={item.id} className={`bg-white/90 rounded-2xl shadow-xl border-2 ${cardBorder} p-6 flex flex-col items-start gap-3 hover:shadow-2xl transition-all`}>
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        <span className="font-semibold text-lg text-blue-900">{item.itemName}</span>
                      </div>
                      <div className="text-gray-700 text-base">Quantity: <span className="font-bold text-blue-700">{item.quantity}</span></div>
                      <div className={`text-base font-medium ${minColor}`}>Minimum Needed: {minQty !== undefined ? minQty : 'Loading...'}</div>
                      {minQty !== undefined && isBelowMin && (
                        <div className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M5.636 5.636l1.414 1.414M17.657 17.657l1.414 1.414M12 8v4m0 4h.01" /></svg>
                          Below minimum required!
                        </div>
                      )}
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