"use client";

import { useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@/src/domain/entities/User";
import { logoutUseCase } from "@/src/shared/di/container";
import { useRouter } from "next/navigation";
import { auth, db } from "@/src/infrastructure/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const dbInstance = db; // TypeScript guard
    let unsubscribeUser: Unsubscribe | null = null;

    // Escuchar cambios en el estado de autenticación
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Limpiar suscripción anterior si existe
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = null;
        }

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Suscribirse al documento del usuario en Firestore
        const userDocRef = doc(dbInstance, "users", firebaseUser.uid);

        unsubscribeUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const user: User & { pendingAuth?: boolean; dashboardConfig?: any } = {
                id: firebaseUser.uid,
                phoneNumber: firebaseUser.phoneNumber || undefined,
                name: userData.name || "",
                role: userData.role as UserRole | undefined,
                documentNumber: userData.documentNumber,
                gender: userData.gender,
                profession: userData.profession,
                country: userData.country,
                department: userData.department,
                city: userData.city,
                neighborhood: userData.neighborhood,
                latitude: userData.latitude,
                longitude: userData.longitude,
                areaType: userData.areaType,
                fromCapitalCity: userData.fromCapitalCity,
                leaderId: userData.leaderId,
                leaderName: userData.leaderName,
                campaignIds: userData.campaignIds || [],
                createdAt: userData.createdAt?.toDate() || new Date(),
                pendingAuth: userData.pendingAuth || false,
                dashboardConfig: userData.dashboardConfig,
              };
              setUser(user);
            } else {
              setUser(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error subscribing to user document:", error);
            setUser(null);
            setLoading(false);
          }
        );
      },
      (error) => {
        console.error("Error in auth state change:", error);
        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const checkAuth = useCallback(async () => {
    // Esta función ya no es necesaria porque el stream se encarga de todo
    // Pero la mantenemos para compatibilidad con código existente
    // El stream ya actualiza automáticamente
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUseCase.execute();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: checkAuth,
  };
}
