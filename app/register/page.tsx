"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { RegisterForm } from "@/src/presentation/components/auth/RegisterForm";

function RegisterContent() {
  const searchParams = useSearchParams();
  const leaderId = searchParams.get("leaderId") || "";
  const leaderName = searchParams.get("leaderName") || "";
  const campaignId = searchParams.get("campaignId") || "";

  // Si no hay parámetros del QR, mostrar error
  if (!leaderId || !leaderName || !campaignId) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Error: Código QR inválido</p>
              <p className="text-sm mt-1">
                Por favor, escanea el código QR proporcionado por tu
                multiplicador.
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Completa tus datos para registrarte
            </p>
          </div>
          <RegisterForm
            leaderId={leaderId}
            leaderName={leaderName}
            campaignId={campaignId}
          />
        </div>
      </div>
    </AuthGuard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
