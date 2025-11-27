"use client";

import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { useAuth } from "@/src/presentation/hooks/useAuth";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Connect</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.name || user?.phoneNumber || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to your Dashboard
                </h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Nombre:</strong> {user?.name}
                    </p>
                    {user?.phoneNumber && (
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Celular:</strong> {user.phoneNumber}
                      </p>
                    )}
                    {user?.email && (
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Email:</strong> {user.email}
                      </p>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-gray-600">
                      This is your dashboard. You can start building your
                      application features here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
