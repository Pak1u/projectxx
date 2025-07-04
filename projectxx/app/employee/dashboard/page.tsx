"use client";
import React from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function EmployeeDashboard() {
  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-3xl font-semibold mb-6">Employee Dashboard</h2>
        <p className="text-gray-600 text-lg">Welcome to your employee dashboard.</p>
      </div>
    </ProtectedRoute>
  );
} 
