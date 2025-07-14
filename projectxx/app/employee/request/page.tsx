"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

const API_BASE = "http://localhost:4000";

export default function CreateRequestPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        // Fetch warehouse inventory for this employee's warehouse
        const res = await fetch(`${API_BASE}/api/employee/inventory`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const data = await res.json();
        console.log("Fetched inventory data:", data, Array.isArray(data.inventory));
        setItems(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedItem(data[0].name);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/warehouse/item-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ itemName: selectedItem, quantity }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create request");
      }
      // On success, go back to marketplace
      router.push("/marketplace");
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-green-50 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <div className="flex flex-col items-center justify-center w-full">
          <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Create Item Request</h2>
          <div className="w-full max-w-2xl bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-blue-100">
            {/* Card Header */}
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-green-500 p-8">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Request New Inventory Item</h3>
                <p className="text-blue-100">Fill out the form below to request a new item for your warehouse.</p>
              </div>
            </div>
            <div className="p-10">
              {/* Place your form and controls here, keeping the original logic and all fields/buttons */}
              {loading ? (
                <p>Loading available items...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : items.length === 0 ? (
                <p>No inventory items available.</p>
              ) : (
                <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Item</label>
                    <select
                      value={selectedItem}
                      onChange={e => setSelectedItem(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                      required
                    >
                      {items.map(item => (
                        <option key={item.id} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-semibold">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                      required
                    />
                    {/* Removed available quantity display since InventoryItem has no quantity */}
                  </div>
                  {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Create Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 