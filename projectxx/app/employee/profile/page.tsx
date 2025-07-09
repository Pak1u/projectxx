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
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
        <h2 className="text-3xl font-semibold mb-6">Employee Profile</h2>
        {loading ? (
          <p>Loading profile...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : profile ? (
          <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <span className="font-semibold">Name:</span> {profile.name}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Email:</span> {profile.user?.email || "-"}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Position:</span> {profile.position}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Warehouse:</span> {profile.warehouse ? profile.warehouse.name : "Not assigned"}
            </div>
            {profile.warehouse && (
              <div className="mb-4 text-sm text-gray-600">
                <div>Location: {profile.warehouse.latitude}, {profile.warehouse.longitude}</div>
                <div>ID: {profile.warehouse.id}</div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
} 