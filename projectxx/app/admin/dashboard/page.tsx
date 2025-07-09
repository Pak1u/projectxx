"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  walmartEmployees?: Employee[];
}

interface Employee {
  id: string;
  name: string;
  position: string;
  user: { email: string };
}

export default function AdminDashboard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [unassignedEmployees, setUnassignedEmployees] = useState<Employee[]>([]);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', latitude: '', longitude: '', employeeIds: [] as string[] });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [addStep, setAddStep] = useState(1);

  const MapPicker = dynamic(() => import('../../register/MapPicker'), { ssr: false });

  const fetchUnassignedEmployees = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch('http://localhost:4000/api/warehouse/unassigned-employees', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (res.ok) {
      setUnassignedEmployees(await res.json());
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    if (lat === null || lng === null) {
      setAddError('Please select a location on the map.');
      setAddLoading(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch('http://localhost:4000/api/warehouse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        name: newWarehouse.name,
        latitude: lat,
        longitude: lng,
        employeeIds: newWarehouse.employeeIds,
      }),
    });
    setAddLoading(false);
    if (res.ok) {
      setShowAddModal(false);
      setNewWarehouse({ name: '', latitude: '', longitude: '', employeeIds: [] });
      setLat(null); setLng(null);
      setAddError('');
      // Refresh warehouses
      fetch('http://localhost:4000/api/warehouse')
        .then(res => res.json())
        .then(data => setWarehouses(data));
    } else {
      setAddError('Failed to add warehouse');
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setAddStep(1);
    setNewWarehouse({ name: '', latitude: '', longitude: '', employeeIds: [] });
    setLat(null); setLng(null);
    setAddError('');
  };

  useEffect(() => {
    fetch('http://localhost:4000/api/warehouse')
      .then(res => res.json())
      .then(data => {
        setWarehouses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load warehouses');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (showAddModal && addStep === 3) {
      fetchUnassignedEmployees();
    }
  }, [showAddModal, addStep]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>
        <button
          className="mb-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          onClick={openAddModal}
        >
          + Add Warehouse
        </button>
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowAddModal(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-4">Add New Warehouse</h3>
              <form onSubmit={handleAddWarehouse} className="space-y-4">
                {addStep === 1 && (
                  <>
                    <input
                      type="text"
                      placeholder="Warehouse Name"
                      className="w-full px-3 py-2 border rounded"
                      value={newWarehouse.name}
                      onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                      onClick={() => setAddStep(2)}
                      disabled={!newWarehouse.name}
                    >
                      Next: Set Location
                    </button>
                  </>
                )}
                {addStep === 2 && (
                  <>
                    <label className="block font-semibold mb-1">Select Location</label>
                    <MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
                    {lat !== null && lng !== null && (
                      <div className="mt-2 text-sm text-gray-700">Selected: {lat.toFixed(5)}, {lng.toFixed(5)}</div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
                        onClick={() => setAddStep(1)}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                        onClick={() => lat !== null && lng !== null && setAddStep(3)}
                        disabled={lat === null || lng === null}
                      >
                        Next: Assign Employees
                      </button>
                    </div>
                  </>
                )}
                {addStep === 3 && (
                  <>
                    <label className="block font-semibold mb-1">Assign Employees</label>
                    <div className="flex gap-4">
                      {/* Unassigned Employees List */}
                      <div className="flex-1">
                        <div className="font-semibold mb-2">Unassigned</div>
                        <ul className="border rounded h-48 overflow-y-auto bg-gray-50">
                          {unassignedEmployees.filter(emp => !newWarehouse.employeeIds.includes(emp.id)).map(emp => (
                            <li
                              key={emp.id}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                              onClick={() => setNewWarehouse({ ...newWarehouse, employeeIds: [...newWarehouse.employeeIds, emp.id] })}
                            >
                              {emp.name} ({emp.user.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Assigned Employees List */}
                      <div className="flex-1">
                        <div className="font-semibold mb-2">To Add</div>
                        <ul className="border rounded h-48 overflow-y-auto bg-green-50">
                          {unassignedEmployees.filter(emp => newWarehouse.employeeIds.includes(emp.id)).map(emp => (
                            <li
                              key={emp.id}
                              className="px-3 py-2 cursor-pointer hover:bg-green-100"
                              onClick={() => setNewWarehouse({ ...newWarehouse, employeeIds: newWarehouse.employeeIds.filter(id => id !== emp.id) })}
                            >
                              {emp.name} ({emp.user.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
                        onClick={() => setAddStep(2)}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                        disabled={addLoading}
                      >
                        {addLoading ? 'Adding...' : 'Add Warehouse'}
                      </button>
                    </div>
                  </>
                )}
                {addError && <div className="text-red-500 text-sm">{addError}</div>}
              </form>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-gray-600">Loading warehouses...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            {warehouses.map(wh => (
              <div
                key={wh.id}
                className={`cursor-pointer bg-blue-50 hover:bg-blue-100 rounded-lg shadow p-6 transition border-2 ${selected?.id === wh.id ? 'border-blue-600' : 'border-transparent'}`}
                onClick={() => setSelected(wh)}
              >
                <h3 className="text-xl font-semibold text-blue-900">{wh.name}</h3>
                <p className="text-gray-600">Lat: {wh.latitude}, Lng: {wh.longitude}</p>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div className="mt-8 w-full max-w-xl bg-white rounded shadow p-6 border border-blue-200">
            <h3 className="text-2xl font-bold mb-2 text-blue-800">{selected.name} Details</h3>
            <p className="mb-2 text-gray-700">Location: <span className="font-mono">{selected.latitude}, {selected.longitude}</span></p>
            <div className="mb-2">
              <span className="font-semibold text-gray-800">Employees:</span>
              {selected.walmartEmployees && selected.walmartEmployees.length > 0 ? (
                <ul className="list-disc ml-6 mt-1">
                  {selected.walmartEmployees.map(emp => (
                    <li key={emp.id} className="text-gray-700">
                      {emp.name} ({emp.user?.email})
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500 ml-2">No employees assigned</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-gray-800">Inventory:</span>
              <span className="text-gray-500 ml-2">(Coming soon)</span>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 