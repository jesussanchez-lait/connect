"use client";

import { useState, useEffect } from "react";
import {
  useDashboardConfig,
  DASHBOARD_WIDGETS,
} from "@/src/presentation/hooks/useDashboardConfig";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIDEBAR_MINIMIZED_KEY = "dashboard-sidebar-minimized";

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const { config, toggleWidget, loading } = useDashboardConfig();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Geografía", "Demografía", "Estado"])
  );
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_MINIMIZED_KEY);
      return saved === "true";
    }
    return false;
  });

  // Guardar estado de minimizado en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_MINIMIZED_KEY, String(isMinimized));
    }
  }, [isMinimized]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Agrupar widgets por categoría
  const widgetsByCategory = DASHBOARD_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, typeof DASHBOARD_WIDGETS>);

  return (
    <>
      {/* Overlay - Solo en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 overflow-hidden transition-all duration-300 ease-in-out lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)] lg:z-auto lg:shadow-none lg:rounded-lg lg:border lg:border-gray-200 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        } ${
          isMinimized ? "w-14 lg:w-14" : "w-80"
        }`}
      >
        {/* Contenido cuando está minimizado - Solo icono */}
        {isMinimized ? (
          <div className="h-full flex flex-col items-center py-4">
            <button
              onClick={toggleMinimize}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors mb-4"
              aria-label="Expandir panel"
              title="Expandir panel"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Configurar Dashboard
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMinimize}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Minimizar panel"
                    title="Minimizar"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                    aria-label="Cerrar panel"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
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
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona qué elementos mostrar en el dashboard
              </p>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(widgetsByCategory).map(
                    ([category, widgets]) => (
                      <div
                        key={category}
                        className="border-b border-gray-100 pb-2"
                      >
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <span className="font-medium text-sm text-gray-700">
                            {category}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedCategories.has(category)
                                ? "rotate-180"
                                : ""
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

                        {expandedCategories.has(category) && (
                          <div className="pl-4 space-y-1 mt-1">
                            {widgets.map((widget) => (
                              <label
                                key={widget.id}
                                className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={config[widget.id] ?? true}
                                  onChange={() => toggleWidget(widget.id)}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {widget.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
