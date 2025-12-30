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
import { FollowerDashboard } from "@/src/presentation/components/dashboard/FollowerDashboard";
import { useAuth } from "@/src/presentation/hooks/useAuth";

function DashboardRouter() {
  const { role, loading } = useRole();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar si el usuario está bloqueado
  if (user?.isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Cuenta Bloqueada
            </h2>
            <p className="text-red-700 mb-4">
              Tu cuenta ha sido bloqueada debido a múltiples intentos fallidos
              en la validación de identidad.
            </p>
            <p className="text-sm text-red-600">
              Por favor, contacta al administrador para desbloquear tu cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar dashboard según el rol
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.MULTIPLIER:
      return <MultiplierDashboard />;
    case ROLES.FOLLOWER:
      return <FollowerDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso no autorizado
            </h2>
            <p className="text-gray-600 mb-4">
              Tu rol no tiene acceso al dashboard.
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
