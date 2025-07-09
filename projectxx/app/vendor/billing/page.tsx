"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';

const API_BASE = 'http://localhost:4000';

export default function VendorBillingPage() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchVendorBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/api/vendor/billings`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch vendor billings');
      const data = await res.json();
      setBillings(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorBillings();
  }, []);

  return (
    <ProtectedRoute requiredRole="VENDOR">
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        <h2 className="text-3xl font-semibold mb-6">Vendor Billings</h2>
        {loading ? (
          <p>Loading billings...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : billings.length === 0 ? (
          <p>No completed transactions found.</p>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            {billings.map((billing: any) => (
              <div key={billing.id} className="border rounded-lg p-4 shadow bg-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <div className="font-bold text-lg">{billing.itemRequest?.itemName} (x{billing.itemRequest?.quantity})</div>
                    <div className="text-gray-600 text-sm">Warehouse: {billing.warehouse?.name}</div>
                    <div className="text-gray-600 text-sm">Requested by: {billing.itemRequest?.employee?.name}</div>
                    <div className="text-gray-600 text-sm">Completed: {new Date(billing.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-2 md:mt-0 flex flex-col items-end gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mb-1">COMPLETED</span>
                    <div className="text-lg font-bold text-green-600">${billing.amount.toFixed(2)}</div>
                  </div>
                </div>
                {billing.offers && billing.offers.length > 0 && (
                  <div className="mt-3">
                    <div className="font-semibold text-sm mb-1">Your Accepted Offers:</div>
                    <ul className="text-sm list-disc list-inside">
                      {billing.offers
                        .filter((offer: any) => offer.status === 'ACCEPTED')
                        .map((offer: any) => (
                          <li key={offer.id} className="text-green-600">
                            Qty: {offer.quantity} | Price: ${offer.price} | Total: ${(offer.quantity * offer.price).toFixed(2)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 