"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'EMPLOYEE' | 'VENDOR' | 'ADMIN';
}

const dashboardPath = {
  EMPLOYEE: '/employee/dashboard',
  VENDOR: '/vendor/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoggedIn, role } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!isLoggedIn) {
      router.replace('/login');
    } else if (role && role !== requiredRole) {
      console.log('ProtectedRoute: role value is', role);
      const path = dashboardPath[role as keyof typeof dashboardPath];
      router.replace(path || '/');
      if (!path) {
        console.warn('Unknown role in ProtectedRoute:', role);
      }
    }
  }, [isLoggedIn, role, requiredRole, router, isClient]);

  if (!isClient || !isLoggedIn || (role && role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
} 