"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import {
  RoleProvider,
  useRole,
  ROLES,
} from "@/src/presentation/contexts/RoleContext";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface CampaignDetail {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  participants: number;
  createdAt: string;
  // Datos adicionales para SUPER_ADMIN/ADMIN
  totalMultipliers?: number;
  totalFollowers?: number;
  totalCoordinators?: number;
  totalLinks?: number;
  growthRate?: number;
  activeZones?: number;
  budget?: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  metrics?: {
    registrationsToday: number;
    registrationsThisWeek: number;
    registrationsThisMonth: number;
  };
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">
            {user?.name || "Usuario"}
          </span>
          {user?.phoneNumber && (
            <span className="text-xs text-gray-500">{user.phoneNumber}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "Usuario"}
              </p>
              {user?.phoneNumber && (
                <p className="text-xs text-gray-500">{user.phoneNumber}</p>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClientRef = useRef(new ApiClient());

  const fetchCampaignDetail = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiClientRef.current.get<CampaignDetail>(
        `/dashboard/campaigns/${campaignId}`
      );
      setCampaign(data);
    } catch (err) {
      console.error("Error fetching campaign detail:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar la campaña"
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetail();
    }
  }, [campaignId, fetchCampaignDetail]);

  // Verificar que solo ADMIN y SUPER_ADMIN puedan ver esta página
  if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            Solo los administradores pueden ver los detalles de las campañas.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar la campaña
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Campaña no encontrada"}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Volver"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {campaign.name}
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                {role === ROLES.SUPER_ADMIN ? "Soporte Técnico" : "Dirección"}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Información General */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Descripción
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {campaign.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Estado
                </label>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status === "active" ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha de Inicio
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(campaign.startDate).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha de Fin
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(campaign.endDate).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Participantes
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {campaign.participants.toLocaleString()}
              </p>
            </div>
            {campaign.totalMultipliers !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Multiplicadores
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {campaign.totalMultipliers.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.totalFollowers !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Seguidores
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {campaign.totalFollowers.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.activeZones !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Zonas Activas
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {campaign.activeZones.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Métricas de Crecimiento */}
          {campaign.metrics && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Métricas de Crecimiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Hoy
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsToday}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Esta Semana
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsThisWeek}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registros Este Mes
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {campaign.metrics.registrationsThisMonth}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Presupuesto */}
          {campaign.budget && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Presupuesto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Asignado
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${campaign.budget.allocated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Gastado
                  </label>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ${campaign.budget.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Restante
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ${campaign.budget.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (campaign.budget.spent / campaign.budget.allocated) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(
                    (campaign.budget.spent / campaign.budget.allocated) *
                    100
                  ).toFixed(1)}
                  % del presupuesto utilizado
                </p>
              </div>
            </div>
          )}

          {/* Desglose por Roles */}
          {(campaign.totalCoordinators !== undefined ||
            campaign.totalLinks !== undefined) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Desglose por Roles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaign.totalCoordinators !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Coordinadores
                    </label>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {campaign.totalCoordinators}
                    </p>
                  </div>
                )}
                {campaign.totalLinks !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Enlaces Municipales
                    </label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {campaign.totalLinks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function CampaignDetailPage() {
  return (
    <AuthGuard requireAuth={true}>
      <RoleProvider>
        <div className="min-h-screen bg-gray-50">
          <CampaignDetailContent />
        </div>
      </RoleProvider>
    </AuthGuard>
  );
}
