// Cliente para la API de Colombia: https://api-colombia.com
const API_BASE_URL = "https://api-colombia.com/api/v1";

export interface Department {
  id: number;
  name: string;
  description?: string;
  surface?: number;
  population?: number;
  phonePrefix?: string;
  capital?: string;
  cityCapitalId?: number; // ID de la ciudad capital del departamento
  region?: string;
}

export interface City {
  id: number;
  name: string;
  description?: string;
  surface?: number;
  population?: number;
  postalCode?: string;
  departmentId?: number;
  departmentName?: string;
}

export class ColombiaApiClient {
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Department`);
      if (!response.ok) {
        throw new Error("Error al obtener departamentos");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  }

  async getCitiesByDepartment(departmentId: number): Promise<City[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Department/${departmentId}/cities`
      );
      if (!response.ok) {
        throw new Error("Error al obtener ciudades");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  }

  async getAllCities(): Promise<City[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/City`);
      if (!response.ok) {
        throw new Error("Error al obtener ciudades");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  }
}
