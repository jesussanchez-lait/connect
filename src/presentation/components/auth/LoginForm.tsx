"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  sendOtpUseCase,
  verifyOtpUseCase,
  signInWithEmailPasswordUseCase,
  signInWithGoogleUseCase,
} from "@/src/shared/di/container";
import {
  LoginCredentials,
  OtpVerification,
  EmailPasswordCredentials,
} from "@/src/domain/entities/AuthCredentials";
import { useAuth } from "@/src/presentation/hooks/useAuth";

type AuthMethod = "phone" | "email" | "google";

// Función para formatear número de teléfono al formato (xxx)-xxx-xxxx
function formatPhoneNumber(value: string): string {
  // Remover todos los caracteres no numéricos
  const numbers = value.replace(/\D/g, "");

  // Limitar a 10 dígitos
  const limitedNumbers = numbers.slice(0, 10);

  // Aplicar formato según la cantidad de dígitos
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

export function LoginForm() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  
  // Estados para teléfono/OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  
  // Estados para email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados generales
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const credentials: LoginCredentials = { phoneNumber: normalizedPhone };
      const response = await sendOtpUseCase.execute(credentials);

      if (response.success) {
        setOtpSent(true);
        if (response.otpCode) {
          setDevOtpCode(response.otpCode);
        }
      } else {
        setError(response.message || "Error al enviar OTP");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const verification: OtpVerification = {
        phoneNumber: normalizedPhone,
        otpCode,
      };
      await verifyOtpUseCase.execute(verification);

      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código OTP inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credentials: EmailPasswordCredentials = {
        email: email.trim(),
        password,
      };
      await signInWithEmailPasswordUseCase.execute(credentials);

      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
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
      await signInWithGoogleUseCase.execute();

      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al iniciar sesión con Google. Intenta nuevamente."
      );
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtpCode("");
    setDevOtpCode(null);
    setError("");
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const normalized = normalizePhoneNumber(inputValue);

    setPhoneNumberDisplay(formatted);
    setPhoneNumber(normalized);
  };

  const resetForm = () => {
    setError("");
    setOtpSent(false);
    setOtpCode("");
    setDevOtpCode(null);
    setEmail("");
    setPassword("");
  };

  const handleMethodChange = (method: AuthMethod) => {
    setAuthMethod(method);
    resetForm();
  };

  // Mostrar loading mientras verificamos si el usuario ya está autenticado
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si el usuario ya está autenticado, no mostrar el formulario
  if (isAuthenticated) {
    return null;
  }

  // Si OTP fue enviado, mostrar formulario de verificación
  if (otpSent && authMethod === "phone") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {devOtpCode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            <p className="font-semibold mb-1">Código OTP (solo desarrollo):</p>
            <p className="text-2xl font-mono font-bold">{devOtpCode}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Código OTP (6 dígitos)
          </label>
          <input
            id="otp"
            type="text"
            value={otpCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtpCode(value);
            }}
            required
            maxLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest text-gray-900 placeholder:text-gray-400"
            placeholder="000000"
            autoFocus
          />
          <p className="mt-2 text-sm text-gray-500">
            Ingresa el código de 6 dígitos que recibiste en tu celular
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Verificando..." : "Verificar Código"}
        </button>

        <button
          type="button"
          onClick={handleBackToPhone}
          className="w-full text-sm text-gray-600 hover:text-gray-800"
        >
          ← Volver a ingresar número
        </button>
      </form>
    );
  }

  return (
    <>
      {/* Contenedor invisible para reCAPTCHA de Firebase */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* Selector de método de autenticación */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleMethodChange("phone")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              authMethod === "phone"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Teléfono
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("email")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              authMethod === "email"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("google")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              authMethod === "google"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Google
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulario de Teléfono */}
      {authMethod === "phone" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="(123)-456-7890"
            />
            <p className="mt-2 text-sm text-gray-500">
              Te enviaremos un código de 6 dígitos por SMS
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || normalizePhoneNumber(phoneNumber).length < 10}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Enviando código..." : "Enviar Código OTP"}
          </button>
        </form>
      )}

      {/* Formulario de Email/Password */}
      {authMethod === "email" && (
        <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              placeholder="••••••"
              autoComplete="current-password"
            />
            <p className="mt-2 text-sm text-gray-500">
              Mínimo 6 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || password.length < 6}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      )}

      {/* Botón de Google Sign-In */}
      {authMethod === "google" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "Iniciando sesión..." : "Continuar con Google"}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Al continuar, aceptas nuestros términos y condiciones
          </p>
        </div>
      )}
    </>
  );
}
