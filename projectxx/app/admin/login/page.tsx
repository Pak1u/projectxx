"use client";
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
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
    if (loggedInRole === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (loggedInRole) {
      setError('Not an admin account.');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100 via-orange-50 to-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-200 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-purple-100">
          {/* Card Header */}
          <div className="flex items-center bg-gradient-to-r from-purple-600 to-orange-500 p-8">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mr-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Admin Login</h3>
              <p className="text-orange-100">Access your admin account below.</p>
            </div>
          </div>
          <div className="p-10">
            {/* Place your admin login form here, keeping the original logic and all fields/buttons */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4">
              <input
                type="email"
                placeholder="Admin Email"
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
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 transition"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </form>
            <div className="mt-8 flex justify-center">
              <span className="text-gray-600 mr-2">Not an admin?</span>
              <button
                type="button"
                className="text-purple-600 font-semibold hover:underline focus:outline-none"
                onClick={() => router.push('/login')}
              >
                Go to User Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 