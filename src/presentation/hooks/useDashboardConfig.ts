"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/infrastructure/firebase";

export interface DashboardWidget {
  id: string;
  label: string;
  category: string;
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: "area-type-pie", label: "Distribución Urbano/Rural", category: "Geografía" },
  { id: "gender-pie", label: "Distribución por Sexo", category: "Demografía" },
  { id: "status-area", label: "Participantes por Estado", category: "Estado" },
  { id: "campaign-status-line", label: "Estado de Campañas", category: "Estado" },
  { id: "professions-bar", label: "Top Profesiones", category: "Demografía" },
  { id: "department-bar", label: "Distribución por Departamento", category: "Geografía" },
  { id: "city-bar", label: "Distribución por Ciudad", category: "Geografía" },
  { id: "role-bar", label: "Distribución por Rol", category: "Roles" },
  { id: "team-tree", label: "Árbol de Participantes", category: "Estructura" },
  { id: "campaigns-map", label: "Mapa de Participantes", category: "Geografía" },
];

export interface DashboardConfig {
  [widgetId: string]: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  "area-type-pie": true,
  "gender-pie": true,
  "status-area": true,
  "campaign-status-line": true,
  "professions-bar": true,
  "department-bar": true,
  "city-bar": true,
  "role-bar": true,
  "team-tree": true,
  "campaigns-map": true,
};

export function useDashboardConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar configuración desde Firebase
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.id || !db) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedConfig = userData.dashboardConfig as DashboardConfig | undefined;

          if (savedConfig) {
            // Merge con default config para asegurar que todos los widgets tengan un valor
            const mergedConfig: DashboardConfig = { ...DEFAULT_CONFIG };
            Object.keys(DEFAULT_CONFIG).forEach((key) => {
              mergedConfig[key] = savedConfig[key] ?? DEFAULT_CONFIG[key];
            });
            setConfig(mergedConfig);
          } else {
            setConfig(DEFAULT_CONFIG);
          }
        } else {
          setConfig(DEFAULT_CONFIG);
        }
      } catch (error) {
        console.error("Error loading dashboard config:", error);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [user?.id]);

  // Guardar configuración en Firebase con debounce
  const saveConfig = useCallback(
    async (newConfig: DashboardConfig) => {
      if (!user?.id || !db) {
        return;
      }

      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Actualizar estado inmediatamente
      setConfig(newConfig);

      // Guardar en Firebase después de 1 segundo
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const userDocRef = doc(db, "users", user.id);
          await updateDoc(userDocRef, {
            dashboardConfig: newConfig,
            updatedAt: serverTimestamp(),
          });
          console.log("✅ Dashboard config guardada en Firebase");
        } catch (error) {
          console.error("Error saving dashboard config:", error);
        }
      }, 1000);
    },
    [user?.id]
  );

  // Toggle visibilidad de un widget
  const toggleWidget = useCallback(
    (widgetId: string) => {
      const newConfig = {
        ...config,
        [widgetId]: !config[widgetId],
      };
      saveConfig(newConfig);
    },
    [config, saveConfig]
  );

  // Verificar si un widget está visible
  const isWidgetVisible = useCallback(
    (widgetId: string) => {
      return config[widgetId] ?? DEFAULT_CONFIG[widgetId] ?? true;
    },
    [config]
  );

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    config,
    loading,
    toggleWidget,
    isWidgetVisible,
    widgets: DASHBOARD_WIDGETS,
  };
}

