"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from "next/link";
import io from 'socket.io-client';

const API_BASE = 'http://localhost:4000';
const TRANSIT_TIME_MS = 30000; // 30 seconds

// Distance Display Component for Vendor Marketplace
function DistanceDisplay({ warehouseId, vendorDistances }: { warehouseId: string; vendorDistances: any }) {
  const distanceData = vendorDistances[warehouseId];
  
  if (!distanceData) {
    return <span className="ml-2 text-gray-400 text-xs">Loading distance...</span>;
  }

  const distanceKm = Math.round(distanceData.distance / 1000);
  
  // Color coding based on distance
  let colorClass = '';
  let statusText = '';
  
  if (distanceKm <= 50) {
    colorClass = 'text-green-600';
    statusText = 'Nearby';
  } else if (distanceKm <= 250) {
    colorClass = 'text-yellow-600';
    statusText = 'Regional';
  } else if (distanceKm <= 500) {
    colorClass = 'text-orange-600';
    statusText = 'Long distance';
  } else {
    colorClass = 'text-red-600';
    statusText = 'Out of range';
  }

  return (
    <span className={`ml-2 text-xs ${colorClass}`}>
      📍 {distanceKm}km {statusText}
    </span>
  );
}

// Route Info Component
function RouteInfo({ vendorId, warehouseId }: { vendorId: string; warehouseId: string }) {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/api/warehouse/route-data/${vendorId}/${warehouseId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRouteData(data);
        }
      } catch (err) {
        console.error('Failed to fetch route data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [vendorId, warehouseId]);

  if (loading) {
    return <span className="ml-2 text-gray-400 text-xs">Loading distance...</span>;
  }

  // Always show distance, even if out of range
  const distanceKm = routeData?.distance ? Math.round(routeData.distance / 1000) : null;
  
  if (distanceKm === null) {
    return <span className="ml-2 text-gray-500 text-xs">Distance unavailable</span>;
  }

  // Color coding based on distance
  let colorClass = '';
  let statusText = '';
  
  if (distanceKm <= 50) {
    colorClass = 'text-green-600';
    statusText = 'Nearby';
  } else if (distanceKm <= 250) {
    colorClass = 'text-yellow-600';
    statusText = 'Regional';
  } else if (distanceKm <= 500) {
    colorClass = 'text-orange-600';
    statusText = 'Long distance';
  } else {
    colorClass = 'text-red-600';
    statusText = 'Out of range';
  }

  const travelTimeMinutes = routeData?.time ? Math.round(routeData.time / 60) : null;

  return (
    <span className={`ml-2 text-xs ${colorClass}`}>
      📍 {distanceKm}km {statusText}
      {travelTimeMinutes && ` (${travelTimeMinutes}min)`}
    </span>
  );
}

// Countdown Timer Component
function CountdownTimer({ requestId, onComplete }: { requestId: string; onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(TRANSIT_TIME_MS / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="text-sm text-orange-600 font-semibold">
      Moving to billing in: {timeLeft}s
    </div>
  );
}

function OfferModal({ open, onClose, onSubmit, maxQuantity, loading, error, availableInventory }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (quantity: number) => void;
  maxQuantity: number;
  loading: boolean;
  error: string | null;
  availableInventory?: number;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) setQuantity(1);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h3 className="text-lg font-semibold mb-4">Submit Offer</h3>
        {availableInventory !== undefined && (
          <div className="mb-2 text-sm text-gray-700">Available in your inventory: <span className="font-bold">{availableInventory}</span></div>
        )}
        <form onSubmit={e => { e.preventDefault(); onSubmit(quantity); }}>
          <label className="block mb-2 text-sm">Quantity (max {availableInventory !== undefined ? Math.min(maxQuantity, availableInventory) : maxQuantity}):</label>
          <input
            type="number"
            min={1}
            max={availableInventory !== undefined ? Math.min(maxQuantity, availableInventory) : maxQuantity}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="border rounded px-2 py-1 w-full mb-4"
            required
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [itemRequests, setItemRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [availableInventory, setAvailableInventory] = useState<number>(0);
  const [socket, setSocket] = useState<any>(null);
  const [vendorDistances, setVendorDistances] = useState<any>({});

  useEffect(() => {
    // Get user from localStorage or context
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('Loaded user from localStorage:', userData);
      setUser(userData);
    }
  }, []);

  const fetchItemRequests = async () => {
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
      
      // Filter out requests with accepted offers (they go to transit page)
      const marketplaceRequests = data.filter((req: any) => 
        req.status === 'PENDING' && 
        (!req.offers || !req.offers.some((offer: any) => offer.status === 'ACCEPTED'))
      );
      
      setItemRequests(marketplaceRequests);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemRequests();
    
    // Fetch vendor distances when marketplace loads (for vendors)
    const fetchVendorDistances = async () => {
      if (user?.role === 'VENDOR') {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const res = await fetch(`${API_BASE}/api/warehouse/vendor-distances`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          if (res.ok) {
            const data = await res.json();
            const distancesMap: Record<string, any> = {};
            data.distances.forEach((item: any) => {
              distancesMap[item.warehouseId] = item;
            });
            setVendorDistances(distancesMap);
          }
        } catch (err) {
          console.error('Failed to fetch vendor distances:', err);
        }
      }
    };
    
    fetchVendorDistances();
  }, [user]);

  // WebSocket setup
  useEffect(() => {
    if (!user) return;

    console.log('Setting up WebSocket for user:', user.email, 'role:', user.role);
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server, joining marketplace room');
      newSocket.emit('joinMarketplaceRoom');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    newSocket.on('offerCreated', (data: any) => {
      console.log('Received offerCreated event:', data);
      // Refresh the item requests to show the new offer
      fetchItemRequests();
      
      // Show notification for new offer (only for employees)
      if (user?.role === 'EMPLOYEE') {
        // You can add a toast notification here if you have a toast library
        console.log(`New offer received for ${data.itemRequest.itemName} from ${data.offer.vendor?.name || 'Unknown Vendor'}`);
      }
    });

    return () => {
      if (newSocket) {
        console.log('Cleaning up WebSocket connection');
        newSocket.emit('leaveMarketplaceRoom');
        newSocket.close();
      }
    };
  }, [user]);

  const handleOpenModal = async (req: any) => {
    setSelectedRequest(req);
    setOfferError(null);
    setModalOpen(true);
    
    // Fetch vendor inventory for the item if user is a vendor
    if (user?.role === 'VENDOR') {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/api/vendor/inventory?itemName=${encodeURIComponent(req.itemName)}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch inventory');
        const data = await res.json();
        const inv = Array.isArray(data.inventory) && data.inventory.length > 0 ? data.inventory[0].quantity : 0;
        setAvailableInventory(inv);
      } catch (err) {
        setAvailableInventory(0);
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setOfferError(null);
  };

  const handleSubmitOffer = async (quantity: number) => {
    if (!selectedRequest) return;
    setOfferLoading(true);
    setOfferError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/api/warehouse/item-requests/${selectedRequest.id}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit offer');
      }
      console.log('Offer submitted successfully, refreshing data...');
      handleCloseModal();
      // Add a small delay to ensure the backend has processed the offer
      setTimeout(() => {
        fetchItemRequests();
      }, 500);
    } catch (err: any) {
      setOfferError(err.message || 'Unknown error');
    } finally {
      setOfferLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={user?.role === 'VENDOR' ? 'VENDOR' : 'EMPLOYEE'}>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Marketplace</h2>
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
          {/* Unified Gradient Header */}
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-teal-500 p-6">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Browse & Request Inventory</h3>
              <p className="text-blue-100">Explore available items, request inventory, and connect with vendors.</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* Place your marketplace content/components here, e.g. item list, request form, etc. */}
            {/* Example placeholder: */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Available Items</h2>
              {/* Render your marketplace items here, keeping the original logic */}
              {loading ? (
                <p>Loading item requests...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : itemRequests.length === 0 ? (
                <p>No active item requests found.</p>
              ) : (
                <div className="w-full max-w-4xl space-y-6">
                  {itemRequests.map((req: any) => (
                    <div key={req.id} className="border rounded-lg p-4 shadow bg-white">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                          <div className="font-bold text-lg">{req.itemName} (x{req.quantity})</div>
                          <div className="text-gray-600 text-sm">Warehouse: {req.warehouse?.name}</div>
                          <div className="text-gray-600 text-sm">Requested by: {req.employee?.name}</div>
                          {user?.role === 'VENDOR' && req.warehouse?.id && (
                            <DistanceDisplay warehouseId={req.warehouse.id} vendorDistances={vendorDistances} />
                          )}
                        </div>
                        <div className="mt-2 md:mt-0 flex flex-col items-end gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mb-1">Status: {req.status || 'PENDING'}</span>
                          {user?.role === 'VENDOR' && (
                            <button
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                              onClick={() => handleOpenModal(req)}
                            >
                              Make Offer
                            </button>
                          )}
                        </div>
                      </div>
                      {req.offers && req.offers.length > 0 && (
                        <div className="mt-3">
                          <div className="font-semibold text-sm mb-1">Offers:</div>
                          <ul className="text-sm list-disc list-inside">
                            {req.offers.map((offer: any) => (
                              <li key={offer.id}>
                                Vendor: {offer.vendor?.name || 'Unknown'} | Qty: {offer.quantity} | Status: {offer.status}
                                {offer.vendor?.id && req.warehouse?.id && (
                                  <RouteInfo vendorId={offer.vendor.id} warehouseId={req.warehouse.id} />
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {user?.role === 'EMPLOYEE' && (
                        <div className="mt-3">
                          <Link href={`/marketplace/request/${req.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                            View Details →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Add more sections/cards as needed, following the same UI style */}
          </div>
        </div>
        <OfferModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitOffer}
          maxQuantity={selectedRequest ? selectedRequest.quantity : 1}
          loading={offerLoading}
          error={offerError}
          availableInventory={user?.role === 'VENDOR' ? availableInventory : undefined}
        />
      </div>
    </ProtectedRoute>
  );
} 