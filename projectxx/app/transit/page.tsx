"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from "next/link";
import io from 'socket.io-client';

const API_BASE = 'http://localhost:4000';
const DEFAULT_TRANSIT_TIME_MS = 30000; // 30 seconds fallback

// Countdown Timer Component
function CountdownTimer({ requestId, acceptanceTime, vendorId, warehouseId, onComplete }: { 
  requestId: string; 
  acceptanceTime: string;
  vendorId?: string;
  warehouseId?: string;
  onComplete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [transitTimeMs, setTransitTimeMs] = useState(DEFAULT_TRANSIT_TIME_MS);

  useEffect(() => {
    // Fetch route data to get actual transit time
    const fetchTransitTime = async () => {
      if (vendorId && warehouseId) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const res = await fetch(`${API_BASE}/api/warehouse/route-data/${vendorId}/${warehouseId}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          if (res.ok) {
            const routeData = await res.json();
            if (routeData && routeData.reachable && routeData.time) {
              // Convert travel time from seconds to milliseconds
              setTransitTimeMs(routeData.time * 1000);
            }
          }
        } catch (err) {
          console.error('Failed to fetch route data for transit timer:', err);
        }
      }
    };

    fetchTransitTime();
  }, [vendorId, warehouseId]);

  useEffect(() => {
    // Calculate the actual remaining time based on when the offer was accepted
    const calculateRemainingTime = () => {
      const acceptanceDate = new Date(acceptanceTime);
      const now = new Date();
      const elapsedMs = now.getTime() - acceptanceDate.getTime();
      const remainingMs = Math.max(0, transitTimeMs - elapsedMs);
      return Math.ceil(remainingMs / 1000);
    };

    // Set initial time
    setTimeLeft(calculateRemainingTime());

    const timer = setInterval(() => {
      const remaining = calculateRemainingTime();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [acceptanceTime, transitTimeMs, onComplete]);

  return (
    <div className="text-sm text-orange-600 font-semibold">
      Moving to billing in: {timeLeft}s
    </div>
  );
}

export default function TransitPage() {
  const [transitRequests, setTransitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // WebSocket setup
  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('joinTransitRoom');
    });

    newSocket.on('offerAccepted', (data) => {
      console.log('Offer accepted event received:', data);
      // Add the new request to transit
      setTransitRequests(prev => {
        const exists = prev.some((req: any) => req.id === data.itemRequest.id);
        if (!exists) {
          return [...prev, data.itemRequest];
        }
        return prev;
      });
    });

    newSocket.on('transitComplete', (data) => {
      console.log('Transit complete event received:', data);
      // Remove the request from transit
      setTransitRequests(prev => prev.filter((req: any) => req.id !== data.itemRequestId));
    });

    return () => {
      if (newSocket) {
        newSocket.emit('leaveTransitRoom');
        newSocket.close();
      }
    };
  }, [user]);

  const fetchTransitRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/api/warehouse/item-requests`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch item requests');
      const data = await res.json();
      
      // Filter for requests with accepted offers that are still PENDING (in transit)
      const transit = data.filter((req: any) => 
        req.status === 'PENDING' && 
        req.offers && 
        req.offers.some((offer: any) => offer.status === 'ACCEPTED')
      );
      
      setTransitRequests(transit);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitRequests();
  }, []);

  const handleCountdownComplete = (requestId: string) => {
    // Remove the request from transit view
    setTransitRequests(prev => prev.filter((req: any) => req.id !== requestId));
  };

  return (
    <ProtectedRoute requiredRole={user?.role === 'VENDOR' ? 'VENDOR' : 'EMPLOYEE'}>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Transit</h2>
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
          {/* Unified Gradient Header */}
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-teal-500 p-6">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Items in Transit</h3>
              <p className="text-blue-100">Track items currently being delivered to the warehouse.</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="mb-6 w-full flex justify-between items-center">
              <p className="text-gray-600">Items in transit to warehouse</p>
              <Link
                href="/marketplace"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Back to Marketplace
              </Link>
            </div>
            {loading ? (
              <p>Loading transit requests...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : transitRequests.length === 0 ? (
              <p>No items currently in transit.</p>
            ) : (
              <div className="w-full space-y-6">
                {transitRequests.map((req: any) => (
                  <div key={req.id} className="border rounded-lg p-4 shadow bg-gray-50">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                      <div>
                        <div className="font-bold text-lg">{req.itemName} (x{req.quantity})</div>
                        <div className="text-gray-600 text-sm">Warehouse: {req.warehouse?.name}</div>
                        <div className="text-gray-600 text-sm">Requested by: {req.employee?.name}</div>
                      </div>
                      <div className="mt-2 md:mt-0 flex flex-col items-end gap-2">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded mb-1">IN TRANSIT</span>
                        <CountdownTimer 
                          requestId={req.id} 
                          acceptanceTime={req.acceptanceTime || new Date().toISOString()} 
                          vendorId={req.offers?.find((offer: any) => offer.status === 'ACCEPTED')?.vendorId}
                          warehouseId={req.warehouseId}
                          onComplete={() => handleCountdownComplete(req.id)} 
                        />
                      </div>
                    </div>
                    {req.offers && req.offers.length > 0 && (
                      <div className="mt-3">
                        <div className="font-semibold text-sm mb-1">Accepted Offers:</div>
                        <ul className="text-sm list-disc list-inside">
                          {req.offers
                            .filter((offer: any) => offer.status === 'ACCEPTED')
                            .map((offer: any) => (
                              <li key={offer.id} className="text-green-600">
                                Vendor: {offer.vendor?.name || 'Unknown'} | Qty: {offer.quantity} | Price: ${offer.price}
                                {offer.createdAt && (
                                  <span className="ml-2 text-gray-500 text-xs">
                                    Accepted at: {new Date(offer.createdAt).toLocaleString()}
                                  </span>
                                )}
                                {user?.role === 'EMPLOYEE' && offer.vendor?.user?.email && (
                                  <a 
                                    href={`/messages?chat=${encodeURIComponent(offer.vendor.user.email)}`}
                                    className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                                  >
                                    Chat with Vendor
                                  </a>
                                )}
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
        </div>
      </div>
    </ProtectedRoute>
  );
} 