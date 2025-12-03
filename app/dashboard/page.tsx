"use client";

import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { CampaignProvider } from "@/src/presentation/contexts/CampaignContext";
import {
  RoleProvider,
  useRole,
  ROLES,
} from "@/src/presentation/contexts/RoleContext";
import { MultiplierDashboard } from "@/src/presentation/components/dashboard/MultiplierDashboard";
import { FollowerDashboard } from "@/src/presentation/components/dashboard/FollowerDashboard";
import { LinkDashboard } from "@/src/presentation/components/dashboard/LinkDashboard";
import { CoordinatorDashboard } from "@/src/presentation/components/dashboard/CoordinatorDashboard";
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

  // Renderizar dashboard según el rol
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.COORDINATOR:
      return <CoordinatorDashboard />;
    case ROLES.LINK:
      return <LinkDashboard />;
    case ROLES.MULTIPLIER:
      return <MultiplierDashboard />;
    case ROLES.FOLLOWER:
      return <FollowerDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Rol no identificado
            </h2>
            <p className="text-gray-600">
              No se pudo determinar tu rol en el sistema.
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
          <div className="min-h-screen bg-gray-50">
            <DashboardRouter />
          </div>
        </CampaignProvider>
      </RoleProvider>
    </AuthGuard>
  );
}
