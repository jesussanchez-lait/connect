"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { MyLeader } from "./MyLeader";
import { CampaignSelector } from "./CampaignSelector";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { BecomeMultiplierFlow } from "./BecomeMultiplierFlow";
import { IdentityVerificationBanner } from "./IdentityVerificationBanner";
import { CampaignBrochureDropdown } from "./CampaignBrochureDropdown";

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

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="relative user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {/* Avatar en móvil, nombre completo en desktop */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {user?.name || "Usuario"}
          </span>
          {user?.phoneNumber && (
            <span className="text-xs text-gray-500 hidden md:block">
              {user.phoneNumber}
            </span>
          )}
        </div>
        <div className="sm:hidden h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
          {userInitials}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
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

export function FollowerDashboard() {
  const { user } = useAuth();
  const { selectedCampaign, campaigns } = useCampaign();

  return (
    <>
      <IdentityVerificationBanner />
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Connect
              </h1>
              <span className="ml-2 sm:ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded whitespace-nowrap flex-shrink-0">
                Seguidor
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
              <CampaignBrochureDropdown />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Selector de Campaña */}
          <div className="mb-6">
            <CampaignSelector />
          </div>

          {/* Información del Multiplicador */}
          {selectedCampaign && (
            <div className="mb-6">
              <MyLeader />
            </div>
          )}

          {/* Información de Campañas */}
          {user?.campaignIds && user.campaignIds.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mis Campañas
              </h3>
              <div className="space-y-2">
                {user.campaignIds.map((campaignId) => {
                  const campaign = campaigns.find((c) => c.id === campaignId);
                  if (!campaign) return null;
                  return (
                    <div
                      key={campaignId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {campaign.name}
                        </p>
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {campaign.participants} participantes
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón para Volverse Multiplicador */}
          <div className="mb-6">
            <BecomeMultiplierFlow />
          </div>

          {/* Información Personal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mi Información
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <p className="text-sm text-gray-900 mt-1">{user?.name}</p>
              </div>
              {user?.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.phoneNumber}
                  </p>
                </div>
              )}
              {user?.documentNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Documento
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.documentNumber}
                  </p>
                </div>
              )}
              {user?.city && user?.department && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Ubicación
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.city}, {user.department}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
