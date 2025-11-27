"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendOtpUseCase, verifyOtpUseCase } from "@/src/shared/di/container";
import {
  LoginCredentials,
  OtpVerification,
} from "@/src/domain/entities/AuthCredentials";

export function LoginForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credentials: LoginCredentials = { phoneNumber };
      const response = await sendOtpUseCase.execute(credentials);

      if (response.success) {
        setOtpSent(true);
        // En desarrollo, guardar el código OTP para mostrarlo
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
      const verification: OtpVerification = { phoneNumber, otpCode };
      await verifyOtpUseCase.execute(verification);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código OTP inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtpCode("");
    setDevOtpCode(null);
    setError("");
  };

  if (otpSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
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
    <form onSubmit={handleSendOtp} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
          value={phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setPhoneNumber(value);
          }}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="1234567890"
        />
        <p className="mt-2 text-sm text-gray-500">
          Te enviaremos un código de 6 dígitos por SMS
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || phoneNumber.length < 10}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Enviando código..." : "Enviar Código OTP"}
      </button>
    </form>
  );
}
