import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl mt-8 p-6 bg-white rounded shadow-lg">
        {children}
      </div>
    </div>
  );
} 