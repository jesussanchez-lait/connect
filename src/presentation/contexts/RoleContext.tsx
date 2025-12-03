"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { User } from "@/src/domain/entities/User";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  COORDINATOR: "COORDINATOR",
  LINK: "LINK",
  MULTIPLIER: "MULTIPLIER",
  FOLLOWER: "FOLLOWER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

interface RoleContextType {
  role: UserRole | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canRecruit: boolean;
  canApproveDivorces: boolean;
  canViewFraudAlerts: boolean;
  canExportData: boolean;
  canManageCampaigns: boolean;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user) {
      // El rol puede venir del user object directamente o de memberships
      // En mocks, viene directamente del user.role
      // En producción, podría venir de memberships[].role para roles contextuales
      const userRole = (user as any).role as UserRole;
      if (userRole && Object.values(ROLES).includes(userRole)) {
        setRole(userRole);
      } else {
        // Fallback: intentar determinar rol por otras propiedades
        // Por ejemplo, si tiene leaderId, probablemente es FOLLOWER
        if ((user as any).leaderId) {
          setRole(ROLES.FOLLOWER);
        } else {
          // Por defecto, asumir MULTIPLIER si no hay información
          setRole(ROLES.MULTIPLIER);
        }
      }
    } else {
      setRole(null);
    }
  }, [user]);

  const hasRole = (checkRole: UserRole): boolean => {
    return role === checkRole;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return role !== null && roles.includes(role);
  };

  const canRecruit =
    role === ROLES.MULTIPLIER ||
    role === ROLES.LINK ||
    role === ROLES.COORDINATOR ||
    role === ROLES.ADMIN ||
    role === ROLES.SUPER_ADMIN;

  const canApproveDivorces = role === ROLES.COORDINATOR;

  const canViewFraudAlerts = role === ROLES.COORDINATOR;

  const canExportData = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  const canManageCampaigns = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

  return (
    <RoleContext.Provider
      value={{
        role,
        hasRole,
        hasAnyRole,
        canRecruit,
        canApproveDivorces,
        canViewFraudAlerts,
        canExportData,
        canManageCampaigns,
        loading: authLoading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
