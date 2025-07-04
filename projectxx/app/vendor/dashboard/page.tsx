"use client";
import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function VendorDashboard() {
  return (
    <ProtectedRoute requiredRole="VENDOR">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-3xl font-semibold mb-6">Vendor Dashboard</h2>
        <p className="text-gray-600 text-lg">Welcome to your vendor dashboard.</p>
      </div>
    </ProtectedRoute>
  );
} 