"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";

const API_BASE = "http://localhost:4000";

// Distance Display Component for Employee Offers
function OfferDistanceDisplay({ offerId, offerDistances }: { offerId: string; offerDistances: any }) {
  const distanceData = offerDistances[offerId];
  
  if (!distanceData) {
    return <span className="ml-2 text-gray-400 text-xs">Loading distance...</span>;
  }

  if (!distanceData.distance) {
    return <span className="ml-2 text-gray-500 text-xs">Distance unavailable</span>;
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

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [offerDistances, setOfferDistances] = useState<any>({});

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE}/api/warehouse/item-requests`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch item requests");
        const data = await res.json();
        const found = data.find((r: any) => r.id === id);
        setRequest(found);
        
        // Fetch offer distances for employees
        if (found && user?.role === 'EMPLOYEE') {
          try {
            const distanceRes = await fetch(`${API_BASE}/api/warehouse/offer-distances/${id}`, {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            });
            if (distanceRes.ok) {
              const distanceData = await distanceRes.json();
              const distancesMap = {};
              distanceData.distances.forEach((item: any) => {
                distancesMap[item.offerId] = item;
              });
              setOfferDistances(distancesMap);
            }
          } catch (err) {
            console.error('Failed to fetch offer distances:', err);
          }
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRequest();
  }, [id, user]);

  const handleOfferAction = async (offerId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setActionLoading(offerId + action);
    setError(null);
    setToast(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/warehouse/offers/${offerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setToast(errData.error || "Failed to update offer");
        throw new Error(errData.error || "Failed to update offer");
      }
      
      // If offer was accepted, redirect to transit page
      if (action === 'ACCEPTED') {
        router.push('/transit');
        return;
      }
      
      // Update local request state so UI updates immediately
      setRequest((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          offers: prev.offers.map((offer: any) =>
            offer.id === offerId ? { ...offer, status: action } : offer
          ),
        };
      });
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCountdownComplete = () => {
    // This function is no longer needed as countdown is handled in transit page
  };

  return (
    <ProtectedRoute requiredRole={user?.role === 'VENDOR' ? 'VENDOR' : 'EMPLOYEE'}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        {toast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow z-50">
            {toast}
            <button className="ml-2 text-white font-bold" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}
        <h2 className="text-3xl font-semibold mb-6">Request Details</h2>
        {loading ? (
          <p>Loading request...</p>
        ) : !request ? (
          <p>Request not found.</p>
        ) : (
          <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <span className="font-semibold">Item:</span> {request.itemName}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Quantity:</span> {request.quantity}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Warehouse:</span> {request.warehouse?.name}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Requested by:</span> {request.employee?.name}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Offers:</span>
              {request.offers && request.offers.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {request.offers.map((offer: any) => (
                    <li key={offer.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        Vendor: {offer.vendor?.name || 'Unknown'} | Qty: {offer.quantity} | Status: {offer.status}
                        {user?.role === 'EMPLOYEE' && (
                          <OfferDistanceDisplay offerId={offer.id} offerDistances={offerDistances} />
                        )}
                      </div>
                      {user?.role === 'EMPLOYEE' && request.warehouseId === user?.employee?.warehouseId && offer.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                            disabled={actionLoading === offer.id + 'ACCEPTED'}
                            onClick={() => handleOfferAction(offer.id, 'ACCEPTED')}
                          >
                            {actionLoading === offer.id + 'ACCEPTED' ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                            disabled={actionLoading === offer.id + 'REJECTED'}
                            onClick={() => handleOfferAction(offer.id, 'REJECTED')}
                          >
                            {actionLoading === offer.id + 'REJECTED' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No offers yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 