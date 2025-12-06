"use client";

import { useState, useEffect, useMemo } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { FirebaseDataSource } from "@/src/infrastructure/firebase/FirebaseDataSource";
import { User } from "@/src/domain/entities/User";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/infrastructure/firebase";
import Image from "next/image";
import type { Unsubscribe } from "firebase/firestore";

interface Leader {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  photo?: string;
  participants: number; // Cantidad de personas registradas bajo este multiplicador
}

export function MyLeader() {
  const [leader, setLeader] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCampaign } = useCampaign();
  const { user } = useAuth();
  const userDataSource = useMemo(
    () => new FirebaseDataSource<User>("users"),
    []
  );

  // Cargar datos iniciales del líder
  useEffect(() => {
    if (!selectedCampaign || !user) {
      setLeader(null);
      setLoading(false);
      return;
    }

    // Si no tiene leaderId, no hay líder
    if (!user.leaderId) {
      setLeader(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Cargar datos iniciales del líder
    userDataSource
      .getById(user.leaderId)
      .then((leaderUser) => {
        if (!leaderUser) {
          setLeader(null);
          setLoading(false);
          return;
        }

        // Mapear a la interfaz Leader usando participants del usuario
        const leaderData: Leader = {
          id: leaderUser.id,
          name: leaderUser.name,
          phoneNumber: leaderUser.phoneNumber || "",
          email: leaderUser.email,
          photo: undefined, // El User entity no tiene photo, pero lo dejamos por si se agrega después
          participants: leaderUser.participants || 0,
        };

        setLeader(leaderData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching leader:", error);
        setLeader(null);
        setLoading(false);
      });
  }, [selectedCampaign, user, userDataSource]);

  // Escuchar el stream del líder para actualizaciones en tiempo real
  useEffect(() => {
    if (!user?.leaderId || !db) {
      return;
    }

    const leaderId = user.leaderId;
    const docRef = doc(db, "users", leaderId);

    console.log(
      `📡 [MyLeader] Suscribiéndose al stream del multiplicador: ${leaderId}`
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const updatedLeader: Leader = {
            id: docSnap.id,
            name: data.name || "",
            phoneNumber: data.phoneNumber || "",
            email: data.email,
            photo: undefined,
            participants: data.participants || 0,
          };

          console.log(
            `✅ [MyLeader] Multiplicador ${leaderId} actualizado. Participants: ${updatedLeader.participants}`
          );

          setLeader((prev) => {
            // Solo actualizar si realmente cambió algo
            if (
              !prev ||
              prev.participants !== updatedLeader.participants ||
              prev.name !== updatedLeader.name
            ) {
              return updatedLeader;
            }
            return prev;
          });
        } else {
          console.warn(
            `⚠️ [MyLeader] Multiplicador ${leaderId} no existe en Firestore`
          );
          setLeader(null);
        }
      },
      (error) => {
        console.error(
          `❌ [MyLeader] Error en stream del multiplicador ${leaderId}:`,
          error
        );
      }
    );

    // Cleanup: desuscribirse cuando cambie el líder o se desmonte el componente
    return () => {
      console.log(
        `🔌 [MyLeader] Desuscribiéndose del stream del multiplicador: ${leaderId}`
      );
      unsubscribe();
    };
  }, [user?.leaderId]);

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Multiplicador
        </h3>
        <p className="text-gray-500">
          Selecciona una campaña para ver tu multiplicador
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leader) {
    // Si es MULTIPLIER y no tiene líder, no mostrar nada
    if (user?.role === "MULTIPLIER") {
      return null;
    }

    // Para otros roles, mostrar mensaje
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Multiplicador - {selectedCampaign.name}
        </h3>
        <p className="text-gray-500">
          No tienes multiplicador asignado para esta campaña
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mi Multiplicador - {selectedCampaign.name}
      </h3>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {leader.photo ? (
            <Image
              src={leader.photo}
              alt={leader.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
              {leader.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{leader.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{leader.phoneNumber}</p>
          {leader.email && (
            <p className="text-sm text-gray-500 mt-1">{leader.email}</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Equipo:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {leader.participants}{" "}
                {leader.participants === 1 ? "persona" : "personas"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registradas bajo su código QR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
