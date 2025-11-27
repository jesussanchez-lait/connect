"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerUseCase } from "@/src/shared/di/container";
import { RegisterCredentials } from "@/src/domain/entities/AuthCredentials";
import { useColombiaData } from "@/src/presentation/hooks/useColombiaData";
import {
  validateColombianId,
  formatColombianId,
} from "@/src/shared/utils/validation";
import { Stepper } from "@/src/presentation/components/ui/Stepper";

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
  const {
    departments,
    cities,
    loadingDepartments,
    loadingCities,
    loadCitiesByDepartment,
  } = useColombiaData();

  // Datos personales
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentNumberDisplay, setDocumentNumberDisplay] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");

  // Datos territoriales
  const [country, setCountry] = useState("Colombia");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [mapError, setMapError] = useState<string>("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Completed, setStep1Completed] = useState(false);

  const steps = ["Datos Personales", "Datos Territoriales"];

  // Cargar ciudades cuando se selecciona un departamento
  useEffect(() => {
    if (departmentId) {
      loadCitiesByDepartment(Number(departmentId));
      setCityId(""); // Resetear ciudad cuando cambia el departamento
    }
  }, [departmentId, loadCitiesByDepartment]);

  // Obtener geolocalización
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("La geolocalización no está disponible en tu navegador");
      return;
    }

    setMapError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (error) => {
        setMapError("Error al obtener tu ubicación: " + error.message);
      }
    );
  };

  // Validar paso 1
  const validateStep1 = (): boolean => {
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      validateColombianId(documentNumber) &&
      normalizePhoneNumber(phoneNumber).length >= 10
    );
  };

  // Validar paso 2
  const validateStep2 = (): boolean => {
    return departmentId !== "" && cityId !== "" && neighborhood.trim() !== "";
  };

  // Avanzar al siguiente paso
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setStep1Completed(true);
      setCurrentStep(2);
      setError("");
    }
  };

  // Volver al paso anterior
  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validar todos los campos antes de enviar
    if (!validateStep1() || !validateStep2()) {
      setError("Por favor completa todos los campos requeridos");
      setLoading(false);
      return;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const selectedDepartment = departments.find(
        (d) => d.id.toString() === departmentId
      );
      const selectedCity = cities.find((c) => c.id.toString() === cityId);

      const credentials: RegisterCredentials = {
        firstName,
        lastName,
        documentNumber: documentNumber.replace(/\D/g, ""),
        phoneNumber: normalizedPhone,
        country,
        department: selectedDepartment?.name || "",
        city: selectedCity?.name || "",
        neighborhood,
        latitude,
        longitude,
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

  const handleDocumentNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value;
    const formatted = formatColombianId(inputValue);
    const normalized = inputValue.replace(/\D/g, "");

    setDocumentNumberDisplay(formatted);
    setDocumentNumber(normalized);
  };

  const selectedDepartment = departments.find(
    (d) => d.id.toString() === departmentId
  );
  const selectedCity = cities.find((c) => c.id.toString() === cityId);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Stepper
        currentStep={currentStep}
        totalSteps={steps.length}
        stepLabels={steps}
      />

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1: DATOS PERSONALES */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paso 1: Datos Personales
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombres <span className="text-red-500">*</span>
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
                    Apellidos <span className="text-red-500">*</span>
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
                  htmlFor="documentNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número de Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  value={documentNumberDisplay}
                  onChange={handleDocumentNumberChange}
                  required
                  maxLength={17}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123.456.789-0"
                />
                {documentNumber &&
                  !validateColombianId(documentNumber) &&
                  documentNumber.length > 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      Cédula inválida (debe tener entre 7 y 10 dígitos)
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teléfono WhatsApp <span className="text-red-500">*</span>
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
                  Te enviaremos un código de verificación por WhatsApp
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!validateStep1()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: DATOS TERRITORIALES */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paso 2: Datos Territoriales
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  País <span className="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Departamento / Provincia{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  disabled={loadingDepartments}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingDepartments
                      ? "Cargando departamentos..."
                      : "Selecciona un departamento"}
                  </option>
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ciudad / Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  id="city"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  required
                  disabled={!departmentId || loadingCities}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!departmentId
                      ? "Primero selecciona un departamento"
                      : loadingCities
                      ? "Cargando ciudades..."
                      : "Selecciona una ciudad"}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="neighborhood"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Barrio / Vereda <span className="text-red-500">*</span>
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Centro, La Candelaria, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación Aproximada
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    📍 Obtener mi ubicación
                  </button>
                  {mapError && (
                    <p className="text-sm text-red-600">{mapError}</p>
                  )}
                  {latitude && longitude && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded">
                      <p className="text-sm">
                        <strong>Ubicación obtenida:</strong> Lat:{" "}
                        {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                      </p>
                      <p className="text-xs mt-1">
                        Puedes ver tu ubicación en{" "}
                        <a
                          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Google Maps
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  ← Volver al Paso 1
                </button>
                <button
                  type="submit"
                  disabled={loading || !validateStep2()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Registrando..." : "Registrarse"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{" "}
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Iniciar sesión
        </a>
      </div>
    </div>
  );
}
