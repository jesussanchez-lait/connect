"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface Leader {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
}

export function MyLeader() {
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();

  useEffect(() => {
    fetchLeader();
  }, []);

  const fetchLeader = async () => {
    try {
      const data = await apiClient.get<Leader>("/dashboard/my-leader");
      setLeader(data);
    } catch (error) {
      console.error("Error fetching leader:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Multiplicador
        </h3>
        <p className="text-gray-500">No tienes multiplicador asignado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mi Multiplicador
      </h3>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
              {leader.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{leader.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{leader.phoneNumber}</p>
          {leader.email && (
            <p className="text-sm text-gray-500 mt-1">{leader.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}
