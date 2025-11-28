"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import {
  CampaignProvider,
  useCampaign,
} from "@/src/presentation/contexts/CampaignContext";
import { QRCodeSection } from "@/src/presentation/components/dashboard/QRCodeSection";
import { TeamList } from "@/src/presentation/components/dashboard/TeamList";
import { MyLeader } from "@/src/presentation/components/dashboard/MyLeader";
import { ActivityHistory } from "@/src/presentation/components/dashboard/ActivityHistory";
import { TeamMap } from "@/src/presentation/components/dashboard/TeamMap";
import { CampaignSelector } from "@/src/presentation/components/dashboard/CampaignSelector";

function DownloadCampaignProposalButton() {
  const [downloading, setDownloading] = useState(false);
  const { selectedCampaign } = useCampaign();

  const handleDownload = async () => {
    if (!selectedCampaign) {
      alert("Por favor selecciona una campaña primero");
      return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/dashboard/campaign-proposal?campaignId=${selectedCampaign.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar la propuesta");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `propuesta-campana-${selectedCampaign.name.replace(
        /\s+/g,
        "-"
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading proposal:", error);
      alert("Error al descargar la propuesta de campaña");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading || !selectedCampaign}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      title={
        !selectedCampaign
          ? "Selecciona una campaña para descargar"
          : "Descargar propuesta de campaña"
      }
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
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {downloading ? "Descargando..." : "Propuesta"}
    </button>
  );
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
          {!user?.phoneNumber && user?.email && (
            <span className="text-xs text-gray-500">{user.email}</span>
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
              {!user?.phoneNumber && user?.email && (
                <p className="text-xs text-gray-500">{user.email}</p>
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

function DashboardContent() {
  const { user } = useAuth();

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Connect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DownloadCampaignProposalButton />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Selector de Campaña y Multiplicador */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CampaignSelector />
            <MyLeader />
          </div>

          {/* Código QR */}
          <div className="mb-6">
            <QRCodeSection />
          </div>

          {/* Lista de equipo */}
          <div className="mb-6">
            <TeamList />
          </div>

          {/* Mapa del equipo */}
          <div className="mb-6">
            <TeamMap />
          </div>

          {/* Historial de actividades */}
          <div>
            <ActivityHistory />
          </div>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <CampaignProvider>
        <div className="min-h-screen bg-gray-50">
          <DashboardContent />
        </div>
      </CampaignProvider>
    </AuthGuard>
  );
}
