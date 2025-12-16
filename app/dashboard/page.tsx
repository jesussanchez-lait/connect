"use client";

import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { CampaignProvider } from "@/src/presentation/contexts/CampaignContext";
import {
  RoleProvider,
  useRole,
  ROLES,
} from "@/src/presentation/contexts/RoleContext";
import { DashboardConfigProvider } from "@/src/presentation/contexts/DashboardConfigContext";
import { MultiplierDashboard } from "@/src/presentation/components/dashboard/MultiplierDashboard";
import { AdminDashboard } from "@/src/presentation/components/dashboard/AdminDashboard";

function DashboardRouter() {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Renderizar dashboard según el rol - Solo ADMIN y MULTIPLIER
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.MULTIPLIER:
      return <MultiplierDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso no autorizado
            </h2>
            <p className="text-gray-600 mb-4">
              Solo los administradores y multiplicadores pueden acceder al
              dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Tu rol actual: {role || "No identificado"}
            </p>
          </div>
        </div>
      );
  }
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <RoleProvider>
        <CampaignProvider>
          <DashboardConfigProvider>
            <div className="min-h-screen bg-gray-50">
              <DashboardRouter />
            </div>
          </DashboardConfigProvider>
        </CampaignProvider>
      </RoleProvider>
    </AuthGuard>
  );
}
