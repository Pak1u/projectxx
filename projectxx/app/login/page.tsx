"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const loggedInRole = await login(email, password);
    setLoading(false);
    if (loggedInRole === 'VENDOR') router.push('/vendor/dashboard');
    else if (loggedInRole === 'EMPLOYEE') router.push('/employee/dashboard');
    else if (loggedInRole === 'ADMIN') router.push('/admin/dashboard');
    else if (loggedInRole) router.push('/');
    else setError('Invalid credentials');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-up relative">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center shadow-lg mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-1">Login</h2>
          <p className="text-gray-500 text-center">Login as Employee, Vendor, or Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-600 transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
} 