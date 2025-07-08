"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  friendKey: string;
}

interface FriendRequest {
  id: string;
  sender: User;
}

export default function FriendsPage() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const reqRes = await axios.get("/api/friend/requests");
      setRequests(reqRes.data);
      const friendsRes = await axios.get("/api/friend/list");
      setFriends(friendsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load data");
    }
    setLoading(false);
  }

  async function handleAccept(requestId: string) {
    await axios.post("/api/friend/accept", { requestId });
    fetchData();
  }
  async function handleDecline(requestId: string) {
    await axios.post("/api/friend/decline", { requestId });
    fetchData();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Friend Requests</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <div className="mb-8">
            {requests.length === 0 ? (
              <div>No pending friend requests.</div>
            ) : (
              <ul>
                {requests.map((req) => (
                  <li key={req.id} className="flex items-center justify-between mb-2 p-2 border rounded">
                    <span>{req.sender.email}</span>
                    <div>
                      <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleAccept(req.id)}>Accept</button>
                      <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDecline(req.id)}>Decline</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">Your Friends</h2>
          {friends.length === 0 ? (
            <div>You have no friends yet.</div>
          ) : (
            <ul>
              {friends.map((friend) => (
                <li key={friend.id} className="mb-1 p-2 border rounded">
                  {friend.email} <span className="text-xs text-gray-500">({friend.friendKey})</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
} 