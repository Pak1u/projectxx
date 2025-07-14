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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-green-50 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-blue-100">
          {/* Card Header */}
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-green-500 p-8">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Sign Up</h3>
              <p className="text-blue-100">Create your account below.</p>
            </div>
          </div>
          <div className="p-10">
            {/* Place your signup form here, keeping the original logic and all fields/buttons */}
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
            <div className="mt-8 flex justify-center">
              <span className="text-gray-600 mr-2">Already have an account?</span>
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline focus:outline-none"
                onClick={() => router.push('/login')}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 