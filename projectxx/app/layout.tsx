"use client";

import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './components/Navbar';
import DevLogin from '../components/DevLogin';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Walmart Inventory Manager</title>
        <meta name="description" content="Walmart Inventory Management System" />
      </head>
      <body className="bg-gray-50">
        <AuthProvider>
          <Navbar />
          <DevLogin />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
} 