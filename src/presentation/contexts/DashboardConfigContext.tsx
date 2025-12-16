"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/infrastructure/firebase";
import {
  DashboardConfig,
  DASHBOARD_WIDGETS,
  DEFAULT_CONFIG,
} from "@/src/presentation/hooks/useDashboardConfig";

// Re-exportar para compatibilidad
export { DEFAULT_CONFIG, DASHBOARD_WIDGETS, type DashboardConfig };

interface DashboardConfigContextType {
  config: DashboardConfig;
  loading: boolean;
  toggleWidget: (widgetId: string) => void;
  isWidgetVisible: (widgetId: string) => boolean;
  widgets: typeof DASHBOARD_WIDGETS;
}

const DashboardConfigContext = createContext<
  DashboardConfigContextType | undefined
>(undefined);

export function DashboardConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
          const savedConfig = userData.dashboardConfig as
            | DashboardConfig
            | undefined;

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

      // Guardar en Firebase después de 1 segundo
      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (!db || !user?.id) return;
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

  // Toggle visibilidad de un widget - usar función de actualización funcional
  const toggleWidget = useCallback(
    (widgetId: string) => {
      setConfig((currentConfig) => {
        const newConfig = {
          ...currentConfig,
          [widgetId]: !currentConfig[widgetId],
        };
        // Guardar en Firebase con debounce
        saveConfig(newConfig);
        return newConfig;
      });
    },
    [saveConfig]
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

  return (
    <DashboardConfigContext.Provider
      value={{
        config,
        loading,
        toggleWidget,
        isWidgetVisible,
        widgets: DASHBOARD_WIDGETS,
      }}
    >
      {children}
    </DashboardConfigContext.Provider>
  );
}

export function useDashboardConfig() {
  const context = useContext(DashboardConfigContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardConfig must be used within a DashboardConfigProvider"
    );
  }
  return context;
}
