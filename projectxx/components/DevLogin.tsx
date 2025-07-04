"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';

// Only show this component in development mode
const DEV_MODE = true;

export default function DevLogin() {
  const { loginAsEmployee, loginAsVendor, logout, isLoggedIn, role, email } = useAuth();

  if (!DEV_MODE) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔧 Dev Mode</h3>
      
      {!isLoggedIn ? (
        <div className="space-y-2">
          <button
            onClick={loginAsEmployee}
            className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Login as Employee
          </button>
          <button
            onClick={loginAsVendor}
            className="block w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Login as Vendor
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-yellow-800">
            <div>Logged in as: {email}</div>
            <div>Role: {role}</div>
          </div>
          <button
            onClick={logout}
            className="block w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 