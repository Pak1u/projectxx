"use client";

import React, { useState, useEffect } from 'react';
import RouteMap from '../../components/RouteMap';

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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Route Planner: Your Warehouse & Stores</h1>
      
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
                <label className="block text-sm font-medium mb-2 text-green-800">Select Stores (Vendors) to Visit:</label>
                <div className="max-h-40 overflow-y-auto border p-2 rounded bg-white">
                  {availableStores.length > 0 ? (
                    availableStores.map(store => (
                      <label key={store.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedStoreIds.includes(store.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStoreIds(prev => [...prev, store.id]);
                            } else {
                              setSelectedStoreIds(prev => prev.filter(id => id !== store.id));
                            }
                          }}
                          className="mr-2"
                        />
                        {store.name} ({store.latitude}, {store.longitude})
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No stores available</p>
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

          {/* Warehouse Information (Read-only) */}
          {employeeWarehouse && (
            <div className="mb-4 p-4 border rounded bg-gray-50">
              <h2 className="font-semibold mb-2 text-gray-700">Warehouse Coordinates (Fixed)</h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={warehouse?.lat ?? ''}
                  readOnly
                  className="border p-1 rounded bg-gray-100 text-gray-600"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={warehouse?.lon ?? ''}
                  readOnly
                  className="border p-1 rounded bg-gray-100 text-gray-600"
                />
              </div>
              <p className="text-xs text-gray-500">Your warehouse coordinates are automatically set and cannot be changed.</p>
            </div>
          )}
          
          <div className="mb-4 p-4 border rounded">
            <h2 className="font-semibold mb-2">Stores (Vendors)</h2>
            {stores.map((store, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={store.lat}
                  onChange={(e) => handleStoreChange(idx, 'lat', e.target.value)}
                  className="border p-1 rounded"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={store.lon}
                  onChange={(e) => handleStoreChange(idx, 'lon', e.target.value)}
                  className="border p-1 rounded"
                />
                <button onClick={() => removeStore(idx)} className="text-red-500">Remove</button>
              </div>
            ))}
            <button onClick={addStore} className="bg-blue-500 text-white px-3 py-1 rounded">Add Store</button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={generateMatrix}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Generating Matrix...' : 'Generate Distance Matrix'}
            </button>
            
            {matrix && (
              <button
                onClick={calculateShortestRoute}
                className="bg-purple-600 text-white px-4 py-2 rounded"
                disabled={calculatingRoute}
              >
                {calculatingRoute ? 'Calculating Route...' : 'Calculate Shortest Route'}
              </button>
            )}
          </div>
          
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
    </div>
  );
} 