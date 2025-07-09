"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function RegisterPage() {
  const { register, role } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'EMPLOYEE' | 'VENDOR'>('EMPLOYEE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (lat === null || lng === null) {
        setError('Please select your location on the map.');
        setLoading(false);
        return;
      }
      const success = await register(email, password, userRole, name, lat, lng);
      setLoading(false);
      if (success) {
        if (userRole === 'VENDOR') router.push('/vendor/dashboard');
        else if (userRole === 'EMPLOYEE') router.push('/employee/dashboard');
        else router.push('/');
      } else {
        setError('Registration failed. Email may already be in use.');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Registration failed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-3xl font-semibold mb-4">Register Page</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="w-full px-3 py-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <select
          className="w-full px-3 py-2 border rounded"
          value={userRole}
          onChange={e => setUserRole(e.target.value as 'EMPLOYEE' | 'VENDOR')}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="VENDOR">Vendor</option>
        </select>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="w-full max-w-sm mt-6">
        <h3 className="mb-2 font-semibold">Select your location on the map</h3>
        <MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
        {lat !== null && lng !== null && (
          <div className="mt-2 text-sm text-gray-700">Selected: {lat.toFixed(5)}, {lng.toFixed(5)}</div>
        )}
      </div>
    </div>
  );
} 