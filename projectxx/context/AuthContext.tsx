"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'VENDOR';
}

interface AuthContextType {
  token: string | null;
  role: 'EMPLOYEE' | 'VENDOR' | null;
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, role: 'EMPLOYEE' | 'VENDOR', name: string) => Promise<boolean>;
  // Development helper functions
  loginAsEmployee: () => void;
  loginAsVendor: () => void;
}

const API_BASE = 'http://localhost:4000';

// Hardcoded development credentials
const DEV_CREDENTIALS = {
  EMPLOYEE: {
    email: 'employee@dev.com',
    password: 'employee123',
    name: 'John Employee',
    role: 'EMPLOYEE' as const,
    token: 'dev-employee-token-12345'
  },
  VENDOR: {
    email: 'vendor@dev.com', 
    password: 'vendor123',
    name: 'Jane Vendor',
    role: 'VENDOR' as const,
    token: 'dev-vendor-token-67890'
  }
};

// Set this to true to enable development mode (bypasses backend)
const DEV_MODE = true;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'EMPLOYEE' | 'VENDOR' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Create user object from individual properties
  const user: User | null = email && name && role ? { email, name, role } : null;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as 'EMPLOYEE' | 'VENDOR' | null;
    const storedEmail = localStorage.getItem('email');
    const storedName = localStorage.getItem('name');
    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      setEmail(storedEmail);
      setName(storedName);
      setIsLoggedIn(true);
    }
  }, []);

  // Development helper functions
  const loginAsEmployee = () => {
    const devUser = DEV_CREDENTIALS.EMPLOYEE;
    setToken(devUser.token);
    setRole(devUser.role);
    setEmail(devUser.email);
    setName(devUser.name);
    setIsLoggedIn(true);
    localStorage.setItem('token', devUser.token);
    localStorage.setItem('role', devUser.role);
    localStorage.setItem('email', devUser.email);
    localStorage.setItem('name', devUser.name);
  };

  const loginAsVendor = () => {
    const devUser = DEV_CREDENTIALS.VENDOR;
    setToken(devUser.token);
    setRole(devUser.role);
    setEmail(devUser.email);
    setName(devUser.name);
    setIsLoggedIn(true);
    localStorage.setItem('token', devUser.token);
    localStorage.setItem('role', devUser.role);
    localStorage.setItem('email', devUser.email);
    localStorage.setItem('name', devUser.name);
  };

  const login = async (email: string, password: string) => {
    // Check if using hardcoded credentials in dev mode
    if (DEV_MODE) {
      if (email === DEV_CREDENTIALS.EMPLOYEE.email && password === DEV_CREDENTIALS.EMPLOYEE.password) {
        loginAsEmployee();
        return true;
      }
      if (email === DEV_CREDENTIALS.VENDOR.email && password === DEV_CREDENTIALS.VENDOR.password) {
        loginAsVendor();
        return true;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setRole(data.role);
      setEmail(data.email);
      setName(data.name);
      setIsLoggedIn(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      localStorage.setItem('name', data.name);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    setName(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
  };

  const register = async (email: string, password: string, role: 'EMPLOYEE' | 'VENDOR', name: string) => {
    // In dev mode, just log in directly with the provided credentials
    if (DEV_MODE) {
      if (role === 'EMPLOYEE') {
        setToken(DEV_CREDENTIALS.EMPLOYEE.token);
        setRole(role);
        setEmail(email);
        setName(name);
        setIsLoggedIn(true);
        localStorage.setItem('token', DEV_CREDENTIALS.EMPLOYEE.token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', email);
        localStorage.setItem('name', name);
        return true;
      } else if (role === 'VENDOR') {
        setToken(DEV_CREDENTIALS.VENDOR.token);
        setRole(role);
        setEmail(email);
        setName(name);
        setIsLoggedIn(true);
        localStorage.setItem('token', DEV_CREDENTIALS.VENDOR.token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', email);
        localStorage.setItem('name', name);
        return true;
      }
    }

    try {
      let body: any = { email, password, role };
      if (role === 'VENDOR') {
        body.vendor = { name, contact: 'Contact Info' };
      } else if (role === 'EMPLOYEE') {
        body.employee = { name, position: 'Position' };
      }
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setRole(data.role);
      setEmail(data.email);
      setName(data.name);
      setIsLoggedIn(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      localStorage.setItem('name', data.name);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      role, 
      email, 
      name, 
      isLoggedIn, 
      user, 
      login, 
      logout, 
      register,
      loginAsEmployee,
      loginAsVendor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 