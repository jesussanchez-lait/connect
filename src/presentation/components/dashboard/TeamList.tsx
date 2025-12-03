"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { AddTeamMemberForm } from "./AddTeamMemberForm";

interface TeamMember {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  department: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  teamSize: number; // Cantidad de personas bajo su perfil
}

type SortField = "name" | "phoneNumber" | "city" | "createdAt" | "teamSize";
type SortOrder = "asc" | "desc";

export function TeamList() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [limit, setLimit] = useState<10 | 20 | 50>(10);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const apiClientRef = useRef(new ApiClient());
  const hasDataRef = useRef(false);
  const { selectedCampaign } = useCampaign();

  const fetchTeam = useCallback(
    async (showLoading: boolean = false) => {
      if (!selectedCampaign) return;

      // Solo mostrar skeleton si se solicita explícitamente
      if (showLoading) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          campaignId: selectedCampaign.id,
          limit: limit.toString(),
          sortBy,
          sortOrder,
        });
        const data = await apiClientRef.current.get<TeamMember[]>(
          `/dashboard/my-team?${params.toString()}`
        );
        setTeam(data);
        hasDataRef.current = true;
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCampaign, limit, sortBy, sortOrder]
  );

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      // Si ya está ordenando por este campo, cambiar el orden
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Si es un campo nuevo, ordenar ascendente por defecto
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleLimitChange = (newLimit: 10 | 20 | 50) => {
    setLimit(newLimit);
  };

  // Carga inicial cuando cambia la campaña - mostrar skeleton
  useEffect(() => {
    if (selectedCampaign) {
      hasDataRef.current = false;
      fetchTeam(true);
    } else {
      setTeam([]);
      setLoading(false);
      hasDataRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

  // Actualización sin skeleton cuando cambian filtros/ordenamiento
  useEffect(() => {
    // Solo hacer fetch si ya hay datos cargados (no es carga inicial)
    if (selectedCampaign && hasDataRef.current) {
      fetchTeam(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, sortBy, sortOrder]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddForm]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAddForm) {
        setShowAddForm(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAddForm]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-9 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Equipo</h3>
        <p className="text-gray-500 text-center py-8">
          Selecciona una campaña para ver tu equipo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Mi Equipo - {selectedCampaign.name} ({team.length})
        </h3>
        <div className="flex items-center gap-3">
          {/* Selector de límite */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Mostrar:</label>
            <select
              value={limit}
              onChange={(e) =>
                handleLimitChange(Number(e.target.value) as 10 | 20 | 50)
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          >
            + Agregar Miembro
          </button>
        </div>
      </div>

      {/* Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Cerrar modal al hacer clic fuera del contenido
            if (e.target === e.currentTarget) {
              setShowAddForm(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Agregar Miembro al Equipo
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                aria-label="Cerrar"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <AddTeamMemberForm
                onSuccess={() => {
                  setShowAddForm(false);
                  fetchTeam();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {team.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Aún no tienes personas registradas bajo tu código
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Nombre
                    {sortBy === "name" && (
                      <svg
                        className={`w-4 h-4 ${
                          sortOrder === "asc" ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("phoneNumber")}
                >
                  <div className="flex items-center gap-2">
                    Teléfono
                    {sortBy === "phoneNumber" && (
                      <svg
                        className={`w-4 h-4 ${
                          sortOrder === "asc" ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center gap-2">
                    Ubicación
                    {sortBy === "city" && (
                      <svg
                        className={`w-4 h-4 ${
                          sortOrder === "asc" ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-2">
                    Fecha Registro
                    {sortBy === "createdAt" && (
                      <svg
                        className={`w-4 h-4 ${
                          sortOrder === "asc" ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("teamSize")}
                >
                  <div className="flex items-center gap-2">
                    Equipo
                    {sortBy === "teamSize" && (
                      <svg
                        className={`w-4 h-4 ${
                          sortOrder === "asc" ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {team.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.neighborhood}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.phoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.city}, {member.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(member.createdAt).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.teamSize}{" "}
                        {member.teamSize === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
