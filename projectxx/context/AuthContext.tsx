"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'VENDOR' | 'ADMIN';
  employee?: any; // Add employee property for EMPLOYEE role
}

interface AuthContextType {
  token: string | null;
  role: 'EMPLOYEE' | 'VENDOR' | 'ADMIN' | null;
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    role: 'EMPLOYEE' | 'VENDOR',
    name: string,
    lat?: number,
    lng?: number
  ) => Promise<boolean>;
}

const API_BASE = 'http://localhost:4000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'EMPLOYEE' | 'VENDOR' | 'ADMIN' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Create user object from individual properties
  const user: User | null = email && name && role ? { email, name, role } : null;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as 'EMPLOYEE' | 'VENDOR' | 'ADMIN' | null;
    const storedEmail = localStorage.getItem('email');
    const storedName = localStorage.getItem('name');
    let storedEmployee = null;
    try {
      storedEmployee = localStorage.getItem('employee') ? JSON.parse(localStorage.getItem('employee')!) : null;
    } catch {}
    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      setEmail(storedEmail);
      setName(storedName);
      setIsLoggedIn(true);
      // If EMPLOYEE, add employee property to user
      if (storedRole === 'EMPLOYEE' && storedEmployee) {
        // Patch user object
        // This is only for local use, not for the context's user object
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
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
      let userObj: User = { email: data.email, name: data.name, role: data.role };
      if (data.role === 'EMPLOYEE') {
        // Fetch employee profile
        const profileRes = await fetch(`${API_BASE}/api/employee/profile`, {
          headers: { 'Authorization': `Bearer ${data.token}` },
        });
        if (profileRes.ok) {
          const employee = await profileRes.json();
          userObj.employee = employee;
          localStorage.setItem('employee', JSON.stringify(employee));
        }
      } else {
        localStorage.removeItem('employee');
      }
      // Store user object with employee if present
      localStorage.setItem('user', JSON.stringify(userObj));
      return data.role; // Return the role
    } catch {
      return null;
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

  const register = async (
    email: string,
    password: string,
    role: 'EMPLOYEE' | 'VENDOR',
    name: string,
    lat?: number,
    lng?: number
  ) => {
    try {
      let body: any = { email, password, role };
      if (lat !== undefined && lng !== undefined) {
        body.latitude = lat;
        body.longitude = lng;
      }
      if (role === 'VENDOR') {
        body.vendor = { name, contact: 'Contact Info' };
      } else if (role === 'EMPLOYEE') {
        body.employee = { name, position: 'Position' };
      }
      console.log('Registering user with data:', body);
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
      let userObj: User = { email: data.email, name: data.name, role: data.role };
      if (data.role === 'EMPLOYEE') {
        // Fetch employee profile after registration
        const profileRes = await fetch(`${API_BASE}/api/employee/profile`, {
          headers: { 'Authorization': `Bearer ${data.token}` },
        });
        if (profileRes.ok) {
          const employee = await profileRes.json();
          userObj.employee = employee;
          // If employee profile has a name, use it
          if (employee.name) {
            userObj.name = employee.name;
            localStorage.setItem('name', employee.name);
          }
          localStorage.setItem('employee', JSON.stringify(employee));
        }
      } else {
        localStorage.removeItem('employee');
      }
      // Store user object with employee if present
      localStorage.setItem('user', JSON.stringify(userObj));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, email, name, isLoggedIn, user: email && name && role ? { email, name, role, ...(role === 'EMPLOYEE' ? { employee: localStorage.getItem('employee') ? JSON.parse(localStorage.getItem('employee')!) : undefined } : {}) } : null, login, logout, register }}>
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