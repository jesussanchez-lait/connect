"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import {
  upgradeToMultiplierUseCase,
  signInWithEmailPasswordUseCase,
  signInWithGoogleUseCase,
  sendOtpUseCase,
  verifyOtpUseCase,
  registerWithEmailPasswordUseCase,
} from "@/src/shared/di/container";
import { GenderSelector } from "@/src/presentation/components/ui/GenderSelector";
import { Gender, User } from "@/src/domain/entities/User";
import {
  EmailPasswordCredentials,
  OtpVerification,
  RegisterCredentials,
} from "@/src/domain/entities/AuthCredentials";
import { LoaderWithText } from "@/src/presentation/components/ui/Loader";
import { useColombiaData } from "@/src/presentation/hooks/useColombiaData";

interface BecomeMultiplierFlowProps {
  onSuccess?: () => void;
  user?: User | null;
}

export function BecomeMultiplierFlow({
  onSuccess,
  user: propUser,
}: BecomeMultiplierFlowProps) {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  // Usar el usuario de la prop si está disponible, sino usar el de auth
  const user = propUser || authUser;
  const { selectedCampaign } = useCampaign();
  const { departments, cities, loadCitiesByDepartment } = useColombiaData();

  const [showModal, setShowModal] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [authMethod, setAuthMethod] = useState<
    "otp" | "credentials" | "google" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para OTP
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Estados para credenciales
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados para registro completo (si no tiene cuenta)
  const [showFullRegistration, setShowFullRegistration] = useState(false);
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    user?.name?.split(" ").slice(1).join(" ") || ""
  );
  const [documentNumber, setDocumentNumber] = useState(
    user?.documentNumber || ""
  );
  const [gender, setGender] = useState<Gender | "">(
    (user?.gender as Gender) || ""
  );
  const [profession, setProfession] = useState(user?.profession || "");
  const [departmentId, setDepartmentId] = useState("");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState(user?.address || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");

  // Actualizar estados cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || "");
      setFirstName(user.name?.split(" ")[0] || "");
      setLastName(user.name?.split(" ").slice(1).join(" ") || "");
      setDocumentNumber(user.documentNumber || "");
      setGender((user.gender as Gender) || "");
      setProfession(user.profession || "");
      setAddress(user.address || "");
      setNeighborhood(user.neighborhood || "");

      // Si el usuario ya tiene departamento y ciudad, inicializar los IDs
      if (user.department && user.city && departments.length > 0) {
        const foundDepartment = departments.find(
          (d) => d.name === user.department
        );
        if (foundDepartment) {
          setDepartmentId(foundDepartment.id.toString());
          // Cargar ciudades del departamento para poder encontrar la ciudad
          loadCitiesByDepartment(foundDepartment.id);
        }
      }
    }
  }, [user, departments, loadCitiesByDepartment]);

  // Cuando se carguen las ciudades, buscar y establecer el cityId si el usuario ya tiene ciudad
  useEffect(() => {
    if (user?.city && cities.length > 0 && !cityId) {
      const foundCity = cities.find((c) => c.name === user.city);
      if (foundCity) {
        setCityId(foundCity.id.toString());
      }
    }
  }, [cities, user, cityId]);

  const handleBecomeMultiplier = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    setShowAuthOptions(true);
  };

  const handleSelectAuthMethod = (method: "otp" | "credentials" | "google") => {
    setAuthMethod(method);
    setError("");

    if (method === "otp") {
      handleSendOtp();
    } else if (method === "google") {
      handleGoogleSignIn();
    } else if (method === "credentials") {
      // Si el usuario no tiene email y tampoco tiene departamento y ciudad,
      // mostrar el formulario completo automáticamente
      if (!user?.email && (!user?.department || !user?.city)) {
        setShowFullRegistration(true);
      }
    }
    // Para credentials, solo mostrar los campos
  };

  const handleSendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError("Número de teléfono inválido");
        setLoading(false);
        return;
      }

      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      const response = await sendOtpUseCase.execute({
        phoneNumber: normalizedPhone,
      });

      if (response.success) {
        setOtpSent(true);
      } else {
        setError(response.message || "Error al enviar código OTP");
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Error al enviar código OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      const verification: OtpVerification = {
        phoneNumber: normalizedPhone,
        otpCode,
      };

      const authResult = await verifyOtpUseCase.execute(verification);

      // Actualizar rol a multiplicador usando el ID del nuevo usuario autenticado
      await upgradeToMultiplierUseCase.execute(authResult.user.id, "otp");

      await refreshUser();
      router.push("/dashboard");
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Código OTP inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async () => {
    setError("");
    setLoading(true);

    try {
      if (!email.trim()) {
        setError("El email es requerido");
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      const credentials: EmailPasswordCredentials = {
        email: email.trim(),
        password,
      };

      const authResult = await signInWithEmailPasswordUseCase.execute(
        credentials
      );

      // Actualizar rol a multiplicador usando el ID del usuario autenticado
      await upgradeToMultiplierUseCase.execute(
        authResult.user.id,
        "credentials"
      );

      await refreshUser();
      router.push("/dashboard");
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const authResult = await signInWithGoogleUseCase.execute();

      // Actualizar rol a multiplicador usando el ID del nuevo usuario autenticado
      await upgradeToMultiplierUseCase.execute(authResult.user.id, "google");

      await refreshUser();
      router.push("/dashboard");
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al autenticar con Google. Intenta nuevamente."
      );
      setLoading(false);
    }
  };

  const handleRegisterWithCredentials = async () => {
    setError("");
    setLoading(true);

    try {
      // Validaciones
      if (!email.trim()) {
        setError("El email es requerido");
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Formato de email inválido");
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      if (!firstName.trim() || !lastName.trim() || !documentNumber.trim()) {
        setError("Todos los campos son requeridos");
        setLoading(false);
        return;
      }

      // Si el usuario ya tiene departamento y ciudad, usarlos
      // Si no, validar que se hayan seleccionado
      let finalDepartment: string;
      let finalCity: string;

      if (user?.department && user?.city) {
        // Usar los datos existentes del usuario
        finalDepartment = user.department;
        finalCity = user.city;
      } else {
        // Validar que se hayan seleccionado departamento y ciudad
        const selectedDepartment = departments.find(
          (d) => d.id.toString() === departmentId
        );
        const selectedCity = cities.find((c) => c.id.toString() === cityId);

        if (!selectedDepartment || !selectedCity) {
          setError("Debes seleccionar departamento y ciudad");
          setLoading(false);
          return;
        }

        finalDepartment = selectedDepartment.name;
        finalCity = selectedCity.name;
      }

      const credentials: RegisterCredentials = {
        firstName,
        lastName,
        documentNumber: documentNumber.replace(/\D/g, ""),
        phoneNumber: phoneNumber.replace(/\D/g, ""),
        email: email.trim(),
        password,
        gender: gender || undefined,
        profession: profession.trim() || undefined,
        country: "Colombia",
        department: finalDepartment,
        city: finalCity,
        address: address || user?.address || "",
        neighborhood: neighborhood || user?.neighborhood || "",
      };

      if (selectedCampaign) {
        credentials.campaignId = selectedCampaign.id;
      }

      // Registrar con email/password
      const authResult = await registerWithEmailPasswordUseCase.execute(
        credentials
      );

      // Actualizar rol a multiplicador usando el ID del nuevo usuario autenticado
      await upgradeToMultiplierUseCase.execute(
        authResult.user.id,
        "credentials"
      );

      await refreshUser();
      router.push("/dashboard");
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "FOLLOWER") {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Quieres ser Multiplicador?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Como multiplicador podrás reclutar nuevos seguidores y tener tu
            propio código QR para compartir.
          </p>
          <button
            onClick={handleBecomeMultiplier}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Volverse Multiplicador
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Convertirse en Multiplicador
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Para convertirte en multiplicador, necesitas registrarte o iniciar
              sesión con uno de los métodos disponibles. Esto te permitirá
              reclutar nuevos seguidores y tener tu propio código QR.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opciones de autenticación */}
      {showAuthOptions && !showFullRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selecciona método de autenticación
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!authMethod ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSelectAuthMethod("otp")}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <h4 className="font-semibold ">Código OTP por SMS</h4>
                      <p className="text-sm text-gray-600">
                        Recibirás un código de verificación en tu teléfono
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAuthMethod("credentials")}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✉️</span>
                    </div>
                    <div>
                      <h4 className="font-semibold ">Email y Contraseña</h4>
                      <p className="text-sm text-gray-600">
                        {user.email
                          ? "Inicia sesión con tu email"
                          : "Crea una cuenta con tu email y una contraseña"}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAuthMethod("google")}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔴</span>
                    </div>
                    <div>
                      <h4 className="font-semibold ">Continuar con Google</h4>
                      <p className="text-sm text-gray-600">
                        Usa tu cuenta de Google para autenticarte
                      </p>
                    </div>
                  </div>
                </button>

                {!user.email && (
                  <button
                    type="button"
                    onClick={() => setShowFullRegistration(true)}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    No tengo cuenta, quiero registrarme completamente
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowAuthOptions(false);
                    setAuthMethod(null);
                    setError("");
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors mt-4"
                >
                  Cancelar
                </button>
              </div>
            ) : authMethod === "otp" ? (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Teléfono
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="3001234567"
                        maxLength={10}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setAuthMethod(null);
                          setError("");
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleSendOtp}
                        disabled={loading || phoneNumber.length < 10}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? "Enviando..." : "Enviar Código"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código OTP (6 dígitos)
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setOtpCode(value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError("");
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={loading || otpCode.length !== 6}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? "Verificando..." : "Verificar"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : authMethod === "credentials" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                {user.email ? (
                  <button
                    onClick={handleEmailPasswordLogin}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </button>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Repite tu contraseña"
                      />
                    </div>
                    <button
                      onClick={handleRegisterWithCredentials}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Registrando..." : "Registrarse"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setAuthMethod(null);
                    setError("");
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Volver
                </button>
              </div>
            ) : authMethod === "google" ? (
              <div className="space-y-4">
                {loading && (
                  <div className="text-center">
                    <LoaderWithText
                      text="Autenticando con Google..."
                      color="blue"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    setAuthMethod(null);
                    setError("");
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Volver
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Registro completo (si no tiene cuenta) */}
      {showFullRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registro Completo
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula *
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) =>
                    setDocumentNumber(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setCityId("");
                    if (e.target.value) {
                      loadCitiesByDepartment(Number(e.target.value));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  disabled={!departmentId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  required
                >
                  <option value="">
                    {!departmentId
                      ? "Primero selecciona un departamento"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barrio *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo
                </label>
                <GenderSelector
                  value={gender}
                  onChange={(value) => setGender(value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Opcional"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowFullRegistration(false);
                    setError("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegisterWithCredentials}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Registrando..." : "Registrarse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
