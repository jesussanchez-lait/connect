"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { QRCodeSection } from "./QRCodeSection";
import { TeamList } from "./TeamList";
import { MyLeader } from "./MyLeader";
import { ActivityHistory } from "./ActivityHistory";
import { TeamMap } from "./TeamMap";
import { CampaignSelector } from "./CampaignSelector";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useTeam } from "@/src/presentation/hooks/useTeam";
import { IdentityVerificationBanner } from "./IdentityVerificationBanner";
import { IdentityVerificationDisclaimer } from "./IdentityVerificationDisclaimer";
import { CampaignBrochureDropdown } from "./CampaignBrochureDropdown";
import { Campaign } from "@/src/domain/entities/Campaign";
import { useToast } from "@/src/presentation/contexts/ToastContext";
import { useIdentityVerification } from "@/src/presentation/hooks/useIdentityVerification";

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
        <div className="sm:hidden h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
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

function CampaignRegistrationLink({
  campaign,
  showCampaignName = false,
}: {
  campaign: Campaign;
  showCampaignName?: boolean;
}) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  // Usar la misma URL que el QR code, incluyendo leaderId y leaderName
  const registrationUrl = user
    ? `${baseUrl}/register/?leaderId=${user.id}&leaderName=${encodeURIComponent(
        user.name || ""
      )}&campaignId=${campaign.id}`
    : `${baseUrl}/register?campaignId=${campaign.id}`;

  const handleCopyLink = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = registrationUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showSuccess("Link copiado al portapapeles");
      } catch (err) {
        showError("No se pudo copiar el link. Por favor, cópialo manualmente.");
      }
      document.body.removeChild(textArea);
      return;
    }

    navigator.clipboard.writeText(registrationUrl).then(
      () => {
        showSuccess("Link copiado al portapapeles");
      },
      () => {
        // Fallback si falla la API
        const textArea = document.createElement("textarea");
        textArea.value = registrationUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          showSuccess("Link copiado al portapapeles");
        } catch (err) {
          showError(
            "No se pudo copiar el link. Por favor, cópialo manualmente."
          );
        }
        document.body.removeChild(textArea);
      }
    );
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Únete a mi red en la campaña ${campaign.name}!\n\nRegístrate aquí: ${registrationUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="space-y-2">
      {showCampaignName && (
        <p className="text-xs font-medium text-indigo-700 mb-1">
          {campaign.name}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium whitespace-nowrap"
          aria-label="Copiar link"
          title="Copiar link"
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="hidden sm:inline">Copiar link</span>
          <span className="sm:hidden">Copiar</span>
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium whitespace-nowrap"
          aria-label="Compartir en WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="hidden sm:inline">Compartir en WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

// Configuración de Didit para validación de identidad
const DIDIT_CONFIG = {
  appId: "f45f97dd-7a57-4146-8aa8-700ee76212d0",
  apiKey: "Bs2R537z65IcGNpgAwabAVzIR3q1sb3GKBjFXSgIl1k",
  workflowId: "106d53cc-e0c8-4743-9146-13f85d03796e",
};

export function MultiplierDashboard() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const [hasLeader, setHasLeader] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const leaderContainerRef = useRef<HTMLDivElement>(null);
  
  // Verificar estado de verificación de identidad
  const { isVerified } = useIdentityVerification(DIDIT_CONFIG);

  // Detectar si MyLeader está renderizando contenido
  useEffect(() => {
    // Si es MULTIPLIER sin leaderId, definitivamente no hay líder
    if (user?.role === "MULTIPLIER" && !user.leaderId) {
      setHasLeader(false);
      return;
    }

    // Si no hay usuario o campaña seleccionada, asumir que no hay líder
    if (!user || !selectedCampaign) {
      setHasLeader(false);
      return;
    }

    // Para otros casos, verificar si hay contenido renderizado después de que React renderice
    const checkLeader = () => {
      if (leaderContainerRef.current) {
        // Verificar si hay algún elemento hijo (MyLeader renderiza un div cuando hay contenido)
        // Cuando retorna null, no hay hijos
        const hasContent = leaderContainerRef.current.children.length > 0;
        setHasLeader(hasContent);
      }
    };

    // Usar requestAnimationFrame para verificar después del render
    const rafId = requestAnimationFrame(() => {
      checkLeader();
    });

    // También usar MutationObserver para detectar cambios dinámicos
    const observer = new MutationObserver(checkLeader);

    if (leaderContainerRef.current) {
      observer.observe(leaderContainerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [selectedCampaign, user]);

  // Use the useTeam hook to check if multiplier has team
  const { team, loading: teamLoading } = useTeam({
    campaignId: selectedCampaign?.id,
  });

  useEffect(() => {
    setCheckingTeam(teamLoading);
    setHasTeam(team.length > 0);
  }, [team, teamLoading]);

  // Escuchar eventos de actualización del equipo
  useEffect(() => {
    const handleTeamUpdate = () => {
      // The useTeam hook will automatically refetch when dependencies change
      // This is just to ensure we update the UI state
      setHasTeam(team.length > 0);
    };

    window.addEventListener("team-updated", handleTeamUpdate);
    return () => {
      window.removeEventListener("team-updated", handleTeamUpdate);
    };
  }, [team]);

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
              <span className="ml-2 sm:ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap flex-shrink-0">
                Multiplicador
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
          {/* Disclaimer de Validación de Identidad - Solo mostrar si no está verificado */}
          {!isVerified && (
            <IdentityVerificationDisclaimer config={DIDIT_CONFIG} />
          )}

          {/* Selector de Campaña y Multiplicador */}
          <div
            className={`grid grid-cols-1 gap-4 mb-4 ${
              hasLeader ? "lg:grid-cols-2" : "lg:grid-cols-1"
            }`}
          >
            <CampaignSelector />
            <div ref={leaderContainerRef}>
              <MyLeader />
            </div>
          </div>

          {/* Link de Registro para Multiplicadores */}
          {selectedCampaign && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-indigo-800 mb-2">
                    Link de Registro para Seguidores
                  </h3>
                  <CampaignRegistrationLink
                    campaign={selectedCampaign}
                    showCampaignName={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Código QR - Solo Multiplicadores tienen QR */}
          <div className="mb-4">
            <QRCodeSection />
          </div>

          {/* Lista de equipo - Seguidores reclutados - Solo mostrar si hay equipo */}
          {hasTeam && (
            <div className="mb-4">
              <TeamList />
            </div>
          )}

          {/* Mapa del equipo - Solo mostrar si hay equipo */}
          {hasTeam && (
            <div className="mb-4">
              <TeamMap />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
