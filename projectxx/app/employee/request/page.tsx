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
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        <h2 className="text-3xl font-semibold mb-6">Create Item Request</h2>
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
    </ProtectedRoute>
  );
} 