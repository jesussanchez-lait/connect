"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useColombiaData } from "@/src/presentation/hooks/useColombiaData";

interface AddTeamMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneNumberDisplay: string;
  departmentId: string;
  cityId: string;
  neighborhood: string;
}

// Función para formatear número de teléfono al formato (xxx)-xxx-xxxx
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limitedNumbers = numbers.slice(0, 10);

  if (limitedNumbers.length === 0) return "";
  if (limitedNumbers.length <= 3) return `(${limitedNumbers}`;
  if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 3)})-${limitedNumbers.slice(3)}`;
  }
  return `(${limitedNumbers.slice(0, 3)})-${limitedNumbers.slice(
    3,
    6
  )}-${limitedNumbers.slice(6)}`;
}

// Función para normalizar número de teléfono (solo dígitos)
function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function AddTeamMemberForm({
  onSuccess,
  onCancel,
}: AddTeamMemberFormProps) {
  const [formData, setFormData] = useState<TeamMemberFormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    phoneNumberDisplay: "",
    departmentId: "",
    cityId: "",
    neighborhood: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiClientRef = useRef(new ApiClient());
  const { selectedCampaign } = useCampaign();
  const {
    departments,
    cities,
    loadingDepartments,
    loadingCities,
    loadCitiesByDepartment,
  } = useColombiaData();

  // Cargar ciudades cuando se selecciona un departamento
  useEffect(() => {
    if (formData.departmentId) {
      loadCitiesByDepartment(Number(formData.departmentId));
      setFormData((prev) => ({ ...prev, cityId: "" }));
    }
  }, [formData.departmentId, loadCitiesByDepartment]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const normalized = normalizePhoneNumber(inputValue);

    setFormData((prev) => ({
      ...prev,
      phoneNumber: normalized,
      phoneNumberDisplay: formatted,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phoneNumber ||
      formData.phoneNumber.length < 10 ||
      !formData.departmentId ||
      !formData.cityId ||
      !formData.neighborhood.trim()
    ) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (!selectedCampaign) {
      setError("Por favor selecciona una campaña");
      return;
    }

    setLoading(true);

    try {
      const selectedDepartment = departments.find(
        (d) => d.id.toString() === formData.departmentId
      );
      const selectedCity = cities.find(
        (c) => c.id.toString() === formData.cityId
      );

      await apiClientRef.current.post("/dashboard/my-team", {
        campaignId: selectedCampaign.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber,
        department: selectedDepartment?.name || "",
        city: selectedCity?.name || "",
        neighborhood: formData.neighborhood.trim(),
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        phoneNumberDisplay: "",
        departmentId: "",
        cityId: "",
        neighborhood: "",
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al agregar miembro al equipo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Apellido *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Teléfono *
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={formData.phoneNumberDisplay}
          onChange={handlePhoneNumberChange}
          placeholder="(300) 123-4567"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Departamento *
          </label>
          <select
            id="department"
            value={formData.departmentId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                departmentId: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            required
            disabled={loadingDepartments}
          >
            <option value="">Selecciona un departamento</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ciudad *
          </label>
          <select
            id="city"
            value={formData.cityId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, cityId: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            required
            disabled={loadingCities || !formData.departmentId}
          >
            <option value="">
              {formData.departmentId
                ? "Selecciona una ciudad"
                : "Primero selecciona un departamento"}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="neighborhood"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Barrio *
        </label>
        <input
          type="text"
          id="neighborhood"
          value={formData.neighborhood}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              neighborhood: e.target.value,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Agregando..." : "Agregar Miembro"}
        </button>
      </div>
    </form>
  );
}
