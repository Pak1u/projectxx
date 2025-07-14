"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";

const API_BASE = "http://localhost:4000";

export default function EmployeeProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE}/api/employee/profile`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-green-50 to-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full opacity-30 blur-2xl -z-10" style={{top: '-4rem', left: '-4rem'}} />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-100 rounded-full opacity-30 blur-2xl -z-10" style={{bottom: '-4rem', right: '-4rem'}} />
        <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Employee Profile</h2>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 text-lg">Loading profile...</span>
          </div>
        ) : error ? (
          <p className="text-red-500 text-lg font-semibold">{error}</p>
        ) : profile ? (
          <div className="w-full max-w-2xl bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-0 overflow-hidden animate-fade-in-up border border-blue-100">
            {/* Card Header with Avatar */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-green-500 p-10 pb-8 relative">
              <div className="w-32 h-32 rounded-full bg-white/80 flex items-center justify-center shadow-2xl mb-4 ring-8 ring-blue-200/40">
                <span className="text-6xl font-extrabold text-blue-600 drop-shadow-lg">{profile.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="text-3xl font-bold text-white tracking-wide flex items-center gap-3">
                  {profile.name}
                  <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold bg-blue-200 text-blue-800 shadow">Active</span>
                </div>
                {profile.id && <div className="text-xs text-blue-100 mt-1">ID: {profile.id}</div>}
              </div>
            </div>
            {/* Card Body - Responsive grid */}
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" /></svg>
                  <span className="font-bold text-lg text-blue-700">{profile.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a3 3 0 01-3 3H9a3 3 0 01-3-3v-1" /></svg>
                  <span className="font-semibold text-gray-800">{profile.user?.email || "-"}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg>
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {profile.warehouse && (
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" /></svg>
                    <span className="font-bold text-orange-700">{profile.warehouse.name}</span>
                  </div>
                )}
                {profile.warehouse && (
                  <div className="ml-10 text-xs text-gray-500">
                    <div>Location: {profile.warehouse.latitude}, {profile.warehouse.longitude}</div>
                    <div>ID: {profile.warehouse.id}</div>
                    {profile.warehouse.address && <div>Address: {profile.warehouse.address}</div>}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0H3" /></svg>
                  <span className="text-gray-700">Role: <span className="font-semibold text-blue-600">Employee</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0H3" /></svg>
                  <span className="text-gray-700">Status: <span className="font-semibold text-green-600">Active</span></span>
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200 mx-10 my-4" />
            {/* About/Bio Section */}
            {profile.about && (
              <div className="px-10 pb-6">
                <div className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  About
                </div>
                <p className="text-gray-600 text-base leading-relaxed">{profile.about}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
} 