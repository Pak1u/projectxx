"use client";

import React, { useState, useEffect } from 'react';
import RouteMap from '../../components/RouteMap';
import { useRouter } from 'next/navigation';

interface Coordinate {
  lat: number;
  lon: number;
}

interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteResult {
  success: boolean;
  minimumCost: number;
  tour: number[];
  error?: string;
}

export default function RoutePlannerPage() {
  const [warehouse, setWarehouse] = useState<Coordinate | null>(null);
  const [stores, setStores] = useState<Coordinate[]>([]);
  const [matrix, setMatrix] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [employeeWarehouse, setEmployeeWarehouse] = useState<Warehouse | null>(null);
  const [initializing, setInitializing] = useState(true);
  // Multi-truck additions
  const [assignedTrucks, setAssignedTrucks] = useState<any[]>([]);
  const [truckRoutes, setTruckRoutes] = useState<any[]>([]); // Array of {routeResult, truck}
  const [selectedTruckIdx, setSelectedTruckIdx] = useState<number>(0);
  const router = useRouter();
  // Load itemId to itemName map from localStorage
  const [itemIdNameMap, setItemIdNameMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const mapStr = localStorage.getItem('itemIdNameMap');
    if (mapStr) {
      try {
        setItemIdNameMap(JSON.parse(mapStr));
      } catch {}
    }
  }, []);

  // On mount, check for assignedTrucks in localStorage
  useEffect(() => {
    const trucksStr = localStorage.getItem('assignedTrucks');
    if (trucksStr) {
      try {
        const trucks = JSON.parse(trucksStr);
        setAssignedTrucks(trucks);
      } catch {}
    }
  }, []);

  // When assignedTrucks is set, fetch employee warehouse and vendor coordinates, then calculate routes for each truck
  useEffect(() => {
    if (assignedTrucks.length === 0) return;
    // Fetch warehouse and vendor coordinates
    const fetchCoordsAndRoutes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/route-coordinates/employee', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setEmployeeWarehouse(data.warehouse);
        // For each truck, get the vendor coordinates
        const vendorMap: Record<string, Store> = {};
        data.stores.forEach((store: Store) => { vendorMap[store.id] = store; });
        // For each truck, build the coordinates array: [warehouse, ...vendors]
        const truckRoutesArr: any[] = [];
        for (let t = 0; t < assignedTrucks.length; ++t) {
          const truck = assignedTrucks[t];
          // Get unique vendor IDs for this truck
          const vendorIds: string[] = Array.from(new Set(truck.destinations));
          const coords = [
            { lat: data.warehouse.latitude, lon: data.warehouse.longitude },
            ...vendorIds.map((id) => ({ lat: vendorMap[id]?.latitude, lon: vendorMap[id]?.longitude }))
          ];
          // Build a robust cache key based on vendor IDs and coordinates
          const vendorKey = vendorIds.map(id => `${id}:${vendorMap[id]?.latitude},${vendorMap[id]?.longitude}`).join('|');
          const cacheKey = `truckRoute_${t}_${vendorKey}`;
          let routeResult = null;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try { routeResult = JSON.parse(cached); } catch {}
          }
          if (!routeResult) {
            // Call backend to get distance matrix and optimal route
            // 1. Build matrix
            const n = coords.length;
            let matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; ++i) {
              for (let j = i + 1; j < n; ++j) {
                const res = await fetch('http://localhost:4000/api/ors-distance', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ coord1: coords[i], coord2: coords[j] })
                });
                const data = await res.json();
                matrix[i][j] = matrix[j][i] = data.distance;
              }
            }
            // 2. Call shortest-route
            const resp = await fetch('http://localhost:4000/api/shortest-route', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ n, matrix })
            });
            routeResult = await resp.json();
            localStorage.setItem(cacheKey, JSON.stringify(routeResult));
          }
          truckRoutesArr.push({ routeResult, truck, coords });
        }
        setTruckRoutes(truckRoutesArr);
        setSelectedTruckIdx(0);
      } catch (err: any) {
        setError(err.message || 'Failed to load truck routes');
      } finally {
        setLoading(false);
      }
    };
    fetchCoordsAndRoutes();
  }, [assignedTrucks]);

  // When selectedTruckIdx changes, update the map and details
  useEffect(() => {
    if (truckRoutes.length > 0 && truckRoutes[selectedTruckIdx]) {
      setRouteResult(truckRoutes[selectedTruckIdx].routeResult);
      // Set warehouse and stores for the map
      const coords = truckRoutes[selectedTruckIdx].coords;
      setWarehouse(coords[0]);
      setStores(coords.slice(1));
    }
  }, [selectedTruckIdx, truckRoutes]);

  // Fetch employee's warehouse and available stores
  const fetchEmployeeCoordinates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/route-coordinates/employee', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not assigned to a warehouse. Please contact your administrator.');
        }
        throw new Error('Failed to fetch employee coordinates');
      }
      
      const data = await response.json();
      setEmployeeWarehouse(data.warehouse);
      setAvailableStores(data.stores);
      
      // Automatically set the warehouse coordinates
      setWarehouse({ lat: data.warehouse.latitude, lon: data.warehouse.longitude });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitializing(false);
    }
  };

  // Load selected stores from database
  const loadSelectedStores = () => {
    if (selectedStoreIds.length === 0) {
      setError('Please select at least one store');
      return;
    }

    const selectedStores = availableStores.filter(store => selectedStoreIds.includes(store.id));
    
    setStores(selectedStores.map(store => ({ lat: store.latitude, lon: store.longitude })));
    setError(null);
  };

  useEffect(() => {
    fetchEmployeeCoordinates();
  }, []);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'lat' | 'lon') => {
    setWarehouse((prev) => ({
      lat: field === 'lat' ? parseFloat(e.target.value) : prev?.lat || 0,
      lon: field === 'lon' ? parseFloat(e.target.value) : prev?.lon || 0,
    }));
  };

  const handleStoreChange = (idx: number, field: 'lat' | 'lon', value: string) => {
    setStores((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: parseFloat(value),
      };
      return copy;
    });
  };

  const addStore = () => setStores((prev) => [...prev, { lat: 0, lon: 0 }]);
  const removeStore = (idx: number) => setStores((prev) => prev.filter((_, i) => i !== idx));

  const generateMatrix = async () => {
    setError(null);
    if (!warehouse) {
      setError('Please set the warehouse coordinates.');
      return;
    }
    if (stores.length === 0) {
      setError('Please add at least one store.');
      return;
    }
    setLoading(true);
    try {
      const coordinates = [warehouse, ...stores];
      const n = coordinates.length;
      const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; ++i) {
        for (let j = i + 1; j < n; ++j) {
          // Call backend API to get ORS distance
          const res = await fetch('http://localhost:4000/api/ors-distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              coord1: coordinates[i],
              coord2: coordinates[j],
            }),
          });
          const data = await res.json();
          if (!res.ok || typeof data.distance !== 'number') {
            throw new Error(data.error || 'Failed to fetch distance');
          }
          matrix[i][j] = matrix[j][i] = data.distance;
        }
      }
      setMatrix(matrix);
      setRouteResult(null); // Clear previous results
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const calculateShortestRoute = async () => {
    if (!matrix) {
      setError('Please generate the distance matrix first.');
      return;
    }
    
    setCalculatingRoute(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4000/api/shortest-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n: matrix.length,
          matrix: matrix
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to calculate shortest route');
      }
      
      setRouteResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shortest route');
    } finally {
      setCalculatingRoute(false);
    }
  };

  const exportMatrix = () => {
    if (!matrix) return '';
    const n = matrix.length;
    let out = n + '\n';
    for (let i = 0; i < n; ++i) {
      for (let j = i + 1; j < n; ++j) {
        out += matrix[i][j] + ' ';
      }
      out += '\n';
    }
    return out;
  };

  const getLocationName = (index: number) => {
    if (index === 0) {
      return 'Warehouse';
    }
    const storeIndex = index - 1;
    if (storeIndex < stores.length) {
      const selectedStore = availableStores.find(store => 
        store.latitude === stores[storeIndex].lat && 
        store.longitude === stores[storeIndex].lon
      );
      return selectedStore?.name || `Store ${index}`;
    }
    return `Store ${index}`;
  };

  // Get warehouse and store names for the map
  const getWarehouseName = () => {
    if (!employeeWarehouse) return "Warehouse";
    return employeeWarehouse.name;
  };

  const getStoreNames = () => {
    return stores.map((store, index) => {
      const selectedStore = availableStores.find(s => 
        s.latitude === store.lat && s.longitude === store.lon
      );
      return selectedStore?.name || `Store ${index + 1}`;
    });
  };

  // Helper to get vendor name from vendorId
  const getVendorName = (vendorId: string) => {
    const vendor = availableStores.find(v => v.id === vendorId);
    return vendor ? vendor.name : vendorId;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Route Planner: Your Warehouse & Stores</h1>
      {/* Truck selector UI */}
      {truckRoutes.length > 0 && (
        <div className="flex gap-2 mb-4">
          {truckRoutes.map((tr, idx) => (
            <button
              key={idx}
              className={`px-4 py-2 rounded border font-bold ${selectedTruckIdx === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setSelectedTruckIdx(idx)}
            >
              Truck {idx + 1}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div>
          {/* Employee Warehouse Info */}
          {initializing ? (
            <div className="mb-6 p-4 border rounded bg-blue-50">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-700">Loading your warehouse information...</p>
              </div>
            </div>
          ) : employeeWarehouse ? (
            <div className="mb-6 p-4 border rounded bg-green-50">
              <h2 className="font-semibold mb-4 text-green-800">Your Warehouse</h2>
              <div className="mb-4">
                <p className="text-green-700 font-medium">{employeeWarehouse.name}</p>
                <p className="text-sm text-green-600">
                  Location: {employeeWarehouse.latitude}, {employeeWarehouse.longitude}
                </p>
              </div>
              
              {/* Store Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-green-800">Vendors (Display Only):</label>
                <div className="max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
                  {stores.length > 0 ? (
                    stores.map((store, idx) => {
                      const selectedStore = availableStores.find(s => s.latitude === store.lat && s.longitude === store.lon);
                      return (
                        <div key={idx} className="flex items-center mb-2 text-gray-700">
                          <span className="font-semibold mr-2">{selectedStore?.name || `Store ${idx + 1}`}</span>
                          <span className="text-xs text-gray-500">({store.lat}, {store.lon})</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No stores selected</p>
                  )}
                </div>
              </div>

              <button 
                onClick={loadSelectedStores}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={selectedStoreIds.length === 0}
              >
                Load Selected Stores
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 border rounded bg-red-50">
              <h2 className="font-semibold mb-4 text-red-800">Warehouse Assignment Required</h2>
              <p className="text-red-700">
                You are not assigned to a warehouse. Please contact your administrator to get assigned to a warehouse.
              </p>
            </div>
          )}
          
          {/* Removed Generate Distance Matrix button as it's no longer needed */}
          
          {error && <div className="text-red-600 mb-2">{error}</div>}
          
          {matrix && (
            <div className="mb-4">
              <h2 className="font-semibold mb-2">Distance Matrix Output</h2>
              <textarea
                className="w-full border rounded p-2"
                rows={Math.max(4, matrix.length + 1)}
                value={exportMatrix()}
                readOnly
              />
            </div>
          )}

          {routeResult && routeResult.success && (
            <div className="mb-4 p-4 border rounded bg-green-50">
              <h2 className="font-semibold mb-2 text-green-800">Shortest Route Results</h2>
              
              <div className="mb-3">
                <span className="font-medium text-green-700">Minimum Cost: </span>
                <span className="text-green-600 font-bold">{(routeResult.minimumCost / 1000).toFixed(2)} km</span>
              </div>
              
              <div className="mb-3">
                <span className="font-medium text-green-700">Optimal Tour: </span>
                <div className="mt-1 p-2 bg-white border rounded">
                  {routeResult.tour.map((node, index) => (
                    <span key={index}>
                      <span className="font-mono text-green-600">{node}</span>
                      <span className="text-green-700"> ({getLocationName(node)})</span>
                      {index < routeResult.tour.length - 1 && (
                        <span className="text-green-500 mx-2">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-green-600">
                <p><strong>Route Summary:</strong></p>
                <p>Start at Warehouse → Visit all stores in optimal order → Return to Warehouse</p>
                <p>Total distance: {(routeResult.minimumCost / 1000).toFixed(2)} km</p>
              </div>
            </div>
          )}

          {routeResult && !routeResult.success && (
            <div className="mb-4 p-4 border rounded bg-red-50">
              <h2 className="font-semibold mb-2 text-red-800">Route Calculation Failed</h2>
              <p className="text-red-600">{routeResult.error}</p>
            </div>
          )}
        </div>

        {/* Right Column - Map */}
        <div>
          <h2 className="font-semibold mb-4">Route Visualization</h2>
          <RouteMap
            warehouse={warehouse}
            stores={stores}
            tour={routeResult?.success ? routeResult.tour : null}
            warehouseName={getWarehouseName()}
            storeNames={getStoreNames()}
            loading={loading || calculatingRoute}
          />
        </div>
      </div>
      {/* Route details for selected truck */}
      {truckRoutes.length > 0 && truckRoutes[selectedTruckIdx] && (
        <div className="mb-4 p-4 border rounded bg-blue-50 shadow">
          <h2 className="font-semibold mb-2 text-blue-800 text-lg flex items-center gap-2">
            <span>🚚 Truck {selectedTruckIdx + 1} Route Details</span>
          </h2>
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            <span className="font-medium text-blue-700">Destinations:</span>
            {assignedTrucks[selectedTruckIdx]?.destinations?.map((dest: string, i: number) => (
              <span key={i} className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-mono">
                {dest}
              </span>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            <span className="font-medium text-blue-700">Items:</span>
            {assignedTrucks[selectedTruckIdx]?.items?.map((item: any, i: number) => (
              <span key={i} className="bg-green-200 text-green-900 px-2 py-1 rounded text-xs font-mono">
                {itemIdNameMap[item.itemId] || item.itemId} (qty: {item.quantity}) from {getVendorName(item.vendorId)}
              </span>
            ))}
          </div>
          <div className="mb-2">
            <span className="font-medium text-blue-700">Minimum Cost: </span>
            <span className="text-blue-600 font-bold">{(truckRoutes[selectedTruckIdx].routeResult?.minimumCost / 1000).toFixed(2)} km</span>
          </div>
          <div className="mb-2">
            <span className="font-medium text-blue-700">Optimal Tour: </span>
            <span className="text-blue-600 font-mono">
              {truckRoutes[selectedTruckIdx].routeResult?.tour?.join(' → ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 