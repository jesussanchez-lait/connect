"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/src/infrastructure/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "./useAuth";

export interface TeamMember {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  department: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  teamSize: number; // Cantidad de personas bajo su perfil (participants)
}

interface UseTeamOptions {
  campaignId?: string;
  limit?: number;
  sortBy?: "name" | "phoneNumber" | "city" | "createdAt" | "teamSize";
  sortOrder?: "asc" | "desc";
}

export function useTeam(options: UseTeamOptions = {}) {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!user?.id || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query: Get ALL users where leaderId = currentUserId
      // AND campaignIds array contains the selected campaignId
      const usersRef = collection(db, "users");
      let q = query(usersRef, where("leaderId", "==", user.id));

      // Filter by campaignId if provided
      const hasCampaignFilter = !!options.campaignId;
      if (hasCampaignFilter) {
        q = query(
          q,
          where("campaignIds", "array-contains", options.campaignId)
        );
      }

      // Apply sorting
      // Note: When using multiple where clauses (leaderId + campaignIds),
      // Firestore requires a composite index. To avoid this, we'll sort in memory
      // when there's a campaign filter. Otherwise, we can use Firestore orderBy.
      const sortField = options.sortBy || "createdAt";
      const sortDirection = options.sortOrder === "asc" ? "asc" : "desc";

      // Only use Firestore orderBy if we don't have campaign filter OR if sorting by a field that doesn't need index
      const useFirestoreOrderBy =
        !hasCampaignFilter &&
        (sortField === "createdAt" || sortField === "name");

      if (useFirestoreOrderBy) {
        if (sortField === "createdAt") {
          q = query(q, orderBy("createdAt", sortDirection));
        } else if (sortField === "name") {
          q = query(q, orderBy("name", sortDirection));
        }
      }

      // Apply limit if provided (only if we're using Firestore orderBy, otherwise limit after sorting)
      const useFirestoreLimit =
        useFirestoreOrderBy && options.limit !== undefined;
      if (useFirestoreLimit && options.limit !== undefined) {
        q = query(q, firestoreLimit(options.limit));
      }

      // Execute query
      const querySnapshot = await getDocs(q);

      // Map documents to team members
      let teamMembers: TeamMember[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
          city: data.city || "",
          department: data.department || "",
          neighborhood: data.neighborhood || "",
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : data.createdAt?.toDate?.() || new Date(),
          teamSize: data.participants || 0, // Count of people registered under this member's QR code
        };
      });

      // Sort in memory if:
      // 1. We have a campaign filter (to avoid composite index requirement)
      // 2. OR we're sorting by a field that doesn't support Firestore orderBy
      // 3. OR we're not using Firestore orderBy for any reason
      if (
        !useFirestoreOrderBy ||
        (sortField !== "createdAt" && sortField !== "name")
      ) {
        teamMembers.sort((a, b) => {
          const aValue = (a as any)[sortField];
          const bValue = (b as any)[sortField];

          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return sortDirection === "asc" ? 1 : -1;
          if (bValue == null) return sortDirection === "asc" ? -1 : 1;

          if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue
              .toLowerCase()
              .localeCompare(bValue.toLowerCase());
            return sortDirection === "asc" ? comparison : -comparison;
          }

          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Apply limit in memory if we didn't use Firestore limit
      if (!useFirestoreLimit && options.limit) {
        teamMembers = teamMembers.slice(0, options.limit);
      }

      setTeam(teamMembers);
    } catch (err: any) {
      console.error("Error fetching team:", err);
      setError(err);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    options.campaignId,
    options.sortBy,
    options.sortOrder,
    options.limit,
  ]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    loading,
    error,
    refetch: fetchTeam,
  };
}
