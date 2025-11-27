"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUseCase } from "@/src/shared/di/container";
import { RegisterCredentials } from "@/src/domain/entities/AuthCredentials";

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

interface RegisterFormProps {
  leaderId: string;
  leaderName: string;
}

export function RegisterForm({ leaderId, leaderName }: RegisterFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const credentials: RegisterCredentials = {
        phoneNumber: normalizedPhone,
        firstName,
        lastName,
        city,
        neighborhood,
        leaderId,
        leaderName,
      };
      await registerUseCase.execute(credentials);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const normalized = normalizePhoneNumber(inputValue);

    setPhoneNumberDisplay(formatted);
    setPhoneNumber(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="text-sm font-medium">
          Te estás registrando bajo el Multiplicador{" "}
          <span className="font-bold">{leaderName}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nombres
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Juan"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Apellidos
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pérez"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Número de Celular
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumberDisplay}
          onChange={handlePhoneNumberChange}
          required
          maxLength={14}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="(123)-456-7890"
        />
        <p className="mt-2 text-sm text-gray-500">
          Te enviaremos un código de verificación por SMS
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Ciudad/Municipio
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Bogotá"
          />
        </div>
        <div>
          <label
            htmlFor="neighborhood"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Barrio/Vereda
          </label>
          <input
            id="neighborhood"
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Centro"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={
          loading ||
          normalizePhoneNumber(phoneNumber).length < 10 ||
          !firstName.trim() ||
          !lastName.trim() ||
          !city.trim() ||
          !neighborhood.trim()
        }
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{" "}
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Iniciar sesión
        </a>
      </div>
    </form>
  );
}
