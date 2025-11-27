"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ColombiaApiClient,
  Department,
  City,
} from "@/src/infrastructure/api/ColombiaApiClient";

const colombiaApi = new ColombiaApiClient();

export function useColombiaData() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    setError(null);
    try {
      const data = await colombiaApi.getDepartments();
      // Ordenar alfabéticamente
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(sorted);
    } catch (err) {
      setError("Error al cargar departamentos");
      console.error(err);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const loadCitiesByDepartment = useCallback(async (departmentId: number) => {
    setLoadingCities(true);
    setError(null);
    setCities([]);
    try {
      const data = await colombiaApi.getCitiesByDepartment(departmentId);
      // Ordenar alfabéticamente
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setCities(sorted);
    } catch (err) {
      setError("Error al cargar ciudades");
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return {
    departments,
    cities,
    loadingDepartments,
    loadingCities,
    error,
    loadCitiesByDepartment,
  };
}
