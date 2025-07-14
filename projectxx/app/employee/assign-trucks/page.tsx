"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Vendor {
  id: string;
  name: string;
  contact: string;
  user: {
    email: string;
    latitude?: number;
    longitude?: number;
  };
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  quantity: number;
  volume: number;
}

interface VendorAssignment {
  vendorId: string;
  vendorName: string;
  items: SelectedItem[];
}

interface TruckResult {
  truckNumber: number;
  destinations: string[];
  items: { itemId: string; quantity: number }[];
}

const API_BASE = 'http://localhost:4000';

export default function AssignTrucks() {
  const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorAssignments, setVendorAssignments] = useState<VendorAssignment[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [truckResults, setTruckResults] = useState<TruckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truckVolume, setTruckVolume] = useState<number>(1000);

  useEffect(() => {
    loadWarehouseInventory();
    loadVendors();
  }, []);

  const loadWarehouseInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/employee/warehouse/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouseInventory(data);
        localStorage.setItem('warehouseInventory', JSON.stringify(data));
      } else {
        setError('Failed to load warehouse inventory');
      }
    } catch (err) {
      setError('Error loading warehouse inventory');
    }
  };

  const loadVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
        setVendorAssignments(data.map((vendor: Vendor) => ({
          vendorId: vendor.id,
          vendorName: vendor.name,
          items: [],
        })));
      } else {
        setError('Failed to load vendors');
      }
    } catch (err) {
      setError('Error loading vendors');
    }
  };

  // Show all items with quantity > 0
  const getAvailableItems = () => {
    return warehouseInventory.filter(item => item.quantity > 0);
  };

  const addItemToVendor = () => {
    if (!selectedVendorId || !selectedItemId || quantity <= 0) return;
    const item = warehouseInventory.find(i => i.id === selectedItemId);
    if (!item) return;

    const currentInventory = JSON.parse(localStorage.getItem('warehouseInventory') || '[]');
    const currentItem = currentInventory.find((i: InventoryItem) => i.id === selectedItemId);
    if (!currentItem || currentItem.quantity < quantity) {
      setError('Not enough inventory available');
      return;
    }

    setVendorAssignments(prev => prev.map(assignment => {
      if (assignment.vendorId === selectedVendorId) {
        const existingItemIndex = assignment.items.findIndex(item => item.itemId === selectedItemId);
        if (existingItemIndex >= 0) {
          const updatedItems = [...assignment.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
          return { ...assignment, items: updatedItems };
        } else {
          return {
            ...assignment,
            items: [...assignment.items, {
              itemId: selectedItemId,
              itemName: item.name,
              quantity: quantity,
              volume: 10,
            }],
          };
        }
      }
      return assignment;
    }));

    const updatedInventory = currentInventory.map((i: InventoryItem) =>
      i.id === selectedItemId ? { ...i, quantity: i.quantity - quantity } : i
    );
    localStorage.setItem('warehouseInventory', JSON.stringify(updatedInventory));
    setWarehouseInventory(updatedInventory);

    setSelectedItemId(null);
    setSelectedVendorId(null);
    setQuantity(1);
    setError(null);
  };

  const removeItemFromVendor = (vendorId: string, itemId: string) => {
    setVendorAssignments(prev => prev.map(assignment => {
      if (assignment.vendorId === vendorId) {
        const itemToRemove = assignment.items.find(item => item.itemId === itemId);
        if (itemToRemove) {
          const currentInventory = JSON.parse(localStorage.getItem('warehouseInventory') || '[]');
          const updatedInventory = currentInventory.map((i: InventoryItem) =>
            i.id === itemId ? { ...i, quantity: i.quantity + itemToRemove.quantity } : i
          );
          localStorage.setItem('warehouseInventory', JSON.stringify(updatedInventory));
          setWarehouseInventory(updatedInventory);
        }
        return {
          ...assignment,
          items: assignment.items.filter(item => item.itemId !== itemId),
        };
      }
      return assignment;
    }));
  };

  const updateItemQuantity = (vendorId: string, itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromVendor(vendorId, itemId);
      return;
    }
    setVendorAssignments(prev => prev.map(assignment => {
      if (assignment.vendorId === vendorId) {
        const itemIndex = assignment.items.findIndex(item => item.itemId === itemId);
        if (itemIndex >= 0) {
          const oldQuantity = assignment.items[itemIndex].quantity;
          const quantityDiff = newQuantity - oldQuantity;
          const currentInventory = JSON.parse(localStorage.getItem('warehouseInventory') || '[]');
          const currentItem = currentInventory.find((i: InventoryItem) => i.id === itemId);
          if (!currentItem || currentItem.quantity < quantityDiff) {
            setError('Not enough inventory available');
            return assignment;
          }
          const updatedInventory = currentInventory.map((i: InventoryItem) =>
            i.id === itemId ? { ...i, quantity: i.quantity - quantityDiff } : i
          );
          localStorage.setItem('warehouseInventory', JSON.stringify(updatedInventory));
          setWarehouseInventory(updatedInventory);

          const updatedItems = [...assignment.items];
          updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: newQuantity };
          return { ...assignment, items: updatedItems };
        }
      }
      return assignment;
    }));
    setError(null);
  };

  const assignTrucks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const processedData = vendorAssignments
        .filter(assignment => assignment.items.length > 0)
        .map(assignment => {
          const itemMap = new Map<string, { itemId: string; quantity: number; volume: number; itemName: string }>();
          assignment.items.forEach(item => {
            if (itemMap.has(item.itemId)) {
              const existing = itemMap.get(item.itemId)!;
              existing.quantity += item.quantity;
            } else {
              itemMap.set(item.itemId, {
                itemId: item.itemId,
                quantity: item.quantity,
                volume: item.volume,
                itemName: item.itemName,
              });
            }
          });
          // Find the vendor in the vendors array to get coordinates
          const vendorObj = vendors.find(v => v.id === assignment.vendorId);
          return {
            vendorId: assignment.vendorId,
            vendorName: assignment.vendorName,
            items: Array.from(itemMap.values()),
            lat: vendorObj?.user?.latitude ?? null,
            lon: vendorObj?.user?.longitude ?? null,
          };
        });

      if (processedData.length === 0) {
        setError('No items assigned to any vendor');
        setIsLoading(false);
        return;
      }

      // Fetch warehouse coordinates from the first vendor's warehouse (or from context if available)
      let warehouseCoords = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/route-coordinates/employee`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.warehouse && typeof data.warehouse.latitude === 'number' && typeof data.warehouse.longitude === 'number') {
            warehouseCoords = { lat: data.warehouse.latitude, lon: data.warehouse.longitude };
          }
        }
      } catch (err) {
        // fallback: do nothing
      }
      if (!warehouseCoords) {
        setError('Could not determine warehouse coordinates');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/employee/assign-trucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendors: processedData,
          truckVolume: truckVolume,
          warehouse: warehouseCoords,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTruckResults(result.trucks);
        await updateBackendInventory();
        // Store truck assignments in localStorage and redirect to route planner
        localStorage.setItem('assignedTrucks', JSON.stringify(result.trucks));
        // Store itemId to itemName mapping
        const itemIdNameMap = Object.fromEntries(warehouseInventory.map(item => [item.id, item.name]));
        localStorage.setItem('itemIdNameMap', JSON.stringify(itemIdNameMap));
        window.location.href = '/employee/route-planner';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to assign trucks');
      }
    } catch (err) {
      setError('Error assigning trucks');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackendInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentInventory = JSON.parse(localStorage.getItem('warehouseInventory') || '[]');
      const response = await fetch(`${API_BASE}/api/employee/warehouse/update-inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inventory: currentInventory }),
      });
      if (!response.ok) {
        console.error('Failed to update backend inventory');
      }
    } catch (err) {
      console.error('Error updating backend inventory:', err);
    }
  };

  const availableItems = getAvailableItems();

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg">Assign Trucks</h2>
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden animate-fade-in-up">
          {/* Unified Gradient Header */}
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-teal-500 p-6">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Assign Trucks & Manage Deliveries</h3>
              <p className="text-blue-100">Select items, assign to vendors, and view truck assignments in one place.</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* Truck Volume Input - Always visible and clear */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-6">
              <label htmlFor="truck-volume" className="block text-sm font-medium text-gray-700 mb-2 md:mb-0 md:w-48">Truck Volume Capacity</label>
              <input
                id="truck-volume"
                type="number"
                value={truckVolume}
                onChange={(e) => setTruckVolume(Number(e.target.value))}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter truck volume (default: 1000)"
                min={1}
              />
            </div>
            {/* Inventory/Vendor Assignment Controls */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Add Items to Vendors</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={selectedVendorId || ''}
                  onChange={(e) => setSelectedVendorId(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedItemId || ''}
                  onChange={(e) => setSelectedItemId(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Item</option>
                  {getAvailableItems().map(item => {
                    const isAssignedToVendor = vendorAssignments
                      .find(v => v.vendorId === selectedVendorId)
                      ?.items.some(i => i.itemId === item.id);
                    return (
                      <option
                        key={item.id}
                        value={item.id}
                        disabled={!!isAssignedToVendor}
                      >
                        {item.name} (Available: {item.quantity})
                      </option>
                    );
                  })}
                </select>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quantity"
                />
                <button
                  onClick={addItemToVendor}
                  disabled={!selectedVendorId || !selectedItemId || quantity <= 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {/* Vendor Assignments List */}
            <div className="space-y-6">
              {vendorAssignments
                .filter(assignment => assignment.items.length > 0)
                .map(assignment => (
                  <div key={assignment.vendorId} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">{assignment.vendorName}</h3>
                    <div className="space-y-2">
                      {assignment.items.map(item => (
                        <div key={item.itemId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-gray-500 ml-2">(Volume: {item.volume})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-20 px-2 py-1 border border-gray-300 rounded text-center bg-gray-100">{item.quantity}</span>
                            <button
                              onClick={() => removeItemFromVendor(assignment.vendorId, item.itemId)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            {/* Assign Trucks Button */}
            <div className="mt-6">
              <button
                onClick={assignTrucks}
                disabled={isLoading || vendorAssignments.every(assignment => assignment.items.length === 0)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning Trucks...' : 'Assign Trucks'}
              </button>
            </div>
            {/* Truck Assignment Results */}
            {truckResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-blue-800">Truck Assignment Results</h2>
                <div className="space-y-4">
                  {truckResults.map((truck, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold mb-2 text-blue-700">Truck {truck.truckNumber}</h3>
                      <div className="mb-2">
                        <span className="font-medium">Destinations: </span>
                        {truck.destinations.map((dest, i) => (
                          <span key={i} className="text-blue-600">
                            {dest}{i < truck.destinations.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Items: </span>
                        {truck.items.map((item, i) => (
                          <span key={i} className="text-green-600">
                            Item {item.itemId} (qty: {item.quantity}){i < truck.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}