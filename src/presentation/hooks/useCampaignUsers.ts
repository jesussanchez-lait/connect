"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/src/infrastructure/firebase/config";
import { User } from "@/src/domain/entities/User";
import { Campaign } from "@/src/domain/entities/Campaign";

/**
 * Hook para obtener usuarios asociados a campañas seleccionadas
 */
export function useCampaignUsers(selectedCampaigns: Campaign[]) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!db || selectedCampaigns.length === 0) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const campaignIds = selectedCampaigns.map((c) => c.id);
        const allUsers: User[] = [];
        const userIds = new Set<string>();

        // Query users for each campaign separately (Firestore doesn't support array-contains-any)
        // and combine results, removing duplicates
        for (const campaignId of campaignIds) {
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("campaignIds", "array-contains", campaignId)
          );
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((docSnap) => {
            const userId = docSnap.id;
            // Only add if we haven't seen this user before
            if (!userIds.has(userId)) {
              userIds.add(userId);
              const data = docSnap.data();
              const user: User = {
                id: docSnap.id,
                phoneNumber: data.phoneNumber,
                name: data.name || "",
                role: data.role,
                documentNumber: data.documentNumber,
                country: data.country,
                department: data.department,
                city: data.city,
                address: data.address,
                neighborhood: data.neighborhood,
                latitude: data.latitude,
                longitude: data.longitude,
                areaType: data.areaType,
                fromCapitalCity: data.fromCapitalCity,
                leaderId: data.leaderId,
                leaderName: data.leaderName,
                campaignIds: data.campaignIds || [],
                participants: data.participants,
                createdAt: data.createdAt?.toDate() || new Date(),
              };
              allUsers.push(user);
            }
          });
        }

        setUsers(allUsers);
      } catch (err) {
        console.error("Error fetching campaign users:", err);
        setError("Error al cargar usuarios de las campañas");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedCampaigns.map((c) => c.id).join(",")]);

  return { users, loading, error };
}
