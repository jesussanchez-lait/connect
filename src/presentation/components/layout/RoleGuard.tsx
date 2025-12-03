"use client";

import { ReactNode } from "react";
import { useRole } from "@/src/presentation/hooks/useRole";
import { UserRole, ROLES } from "@/src/presentation/contexts/RoleContext";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: RoleGuardProps) {
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Componentes de conveniencia para roles específicos
export function SuperAdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function CoordinatorOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[ROLES.COORDINATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function LinkOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[
        ROLES.LINK,
        ROLES.COORDINATOR,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN,
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function MultiplierOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={[
        ROLES.MULTIPLIER,
        ROLES.LINK,
        ROLES.COORDINATOR,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN,
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
