"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/src/presentation/components/layout/AuthGuard";
import { FollowerDashboard } from "@/src/presentation/components/dashboard/FollowerDashboard";
import { LoginForm } from "@/src/presentation/components/auth/LoginForm";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { authRepository } from "@/src/shared/di/container";
import { User } from "@/src/domain/entities/User";
import { LoaderWithText } from "@/src/presentation/components/ui/Loader";
import { CampaignProvider } from "@/src/presentation/contexts/CampaignContext";
import { RoleProvider } from "@/src/presentation/contexts/RoleContext";
import { DashboardConfigProvider } from "@/src/presentation/contexts/DashboardConfigContext";

function DocumentPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentNumber = params?.documentNumber as string;

  useEffect(() => {
    const fetchUser = async () => {
      if (!documentNumber) {
        setError("Número de cédula no proporcionado");
        setLoading(false);
        return;
      }

      const normalizedDoc = documentNumber.replace(/\D/g, "");
      if (normalizedDoc.length < 7 || normalizedDoc.length > 10) {
        setError("Número de cédula inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const foundUser = await authRepository.getUserByDocumentNumber(
          normalizedDoc
        );

        if (!foundUser) {
          setError("Usuario no encontrado");
          setLoading(false);
          return;
        }

        setUser(foundUser);
      } catch (err: any) {
        console.error("Error fetching user:", err);
        setError(err.message || "Error al buscar usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [documentNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoaderWithText text="Cargando..." color="blue" />
      </div>
    );
  }

  if (error || !user) {
    const errorContent = (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error || "Usuario no encontrado"}</p>
          </div>
        </div>
      </div>
    );
    return <AuthGuard requireAuth={false}>{errorContent}</AuthGuard>;
  }

  if (user.role === "FOLLOWER") {
    return (
      <AuthGuard requireAuth={false}>
        <RoleProvider>
          <CampaignProvider user={user}>
            <DashboardConfigProvider>
              <FollowerDashboard user={user} />
            </DashboardConfigProvider>
          </CampaignProvider>
        </RoleProvider>
      </AuthGuard>
    );
  }

  const isMultiplierOrAdmin =
    user.role === "MULTIPLIER" ||
    user.role === "ADMIN" ||
    user.role === "COORDINATOR" ||
    user.role === "LINK";

  if (isMultiplierOrAdmin) {
    if (isAuthenticated && currentUser?.id === user.id) {
      router.push("/dashboard");
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoaderWithText text="Redirigiendo..." color="blue" />
        </div>
      );
    }

    const loginContent = (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Accede a tu cuenta para continuar
            </p>
          </div>
          <LoginForm preferredAuthMethod={user.preferredAuthMethod} />
        </div>
      </div>
    );
    return <AuthGuard requireAuth={false}>{loginContent}</AuthGuard>;
  }

  const unknownRoleContent = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">Acceso no disponible</p>
          <p className="text-sm mt-1">
            Tu cuenta no tiene un rol válido. Por favor, contacta soporte.
          </p>
        </div>
      </div>
    </div>
  );
  return <AuthGuard requireAuth={false}>{unknownRoleContent}</AuthGuard>;
}

export default function DocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoaderWithText text="Cargando..." color="blue" />
        </div>
      }
    >
      <DocumentPageContent />
    </Suspense>
  );
}
