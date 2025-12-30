import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/infrastructure/firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Callback de Didit según documentación: https://docs.didit.me/reference/web-app
 * Didit redirige al callback con query parameters:
 * - verificationSessionId: ID único de la sesión de verificación
 * - status: "Approved" | "Declined" | "In Review"
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verificationSessionId = searchParams.get("verificationSessionId");
    const status = searchParams.get("status");

    if (!verificationSessionId) {
      return NextResponse.json(
        { message: "verificationSessionId es requerido" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { message: "status es requerido" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { message: "Firestore no está inicializado" },
        { status: 500 }
      );
    }

    // Buscar usuario por verificationSessionId (almacenado como identityVerificationWorkflowId)
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("identityVerificationWorkflowId", "==", verificationSessionId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(
        `[IdentityVerification] No se encontró usuario con verificationSessionId: ${verificationSessionId}`
      );
      // Redirigir a dashboard con mensaje de error
      const redirectUrl = new URL("/dashboard", request.nextUrl.origin);
      redirectUrl.searchParams.set("verification", "error");
      return NextResponse.redirect(redirectUrl);
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Mapear estado de Didit a nuestro formato interno
    // Didit devuelve: "Approved", "Declined", "In Review"
    let verificationStatus: "pending" | "verified" | "failed" | "blocked" =
      "pending";
    if (status === "Approved") {
      verificationStatus = "verified";
    } else if (status === "Declined") {
      verificationStatus = "failed";
    } else if (status === "In Review") {
      verificationStatus = "pending";
    }

    // Obtener intentos actuales
    const currentAttempts = userData.identityVerificationAttempts || 0;
    const newAttempts = verificationStatus === "failed" ? currentAttempts + 1 : currentAttempts;

    // Preparar datos de actualización
    const updateData: any = {
      identityVerificationStatus: verificationStatus,
      identityVerificationAttempts: newAttempts,
      updatedAt: serverTimestamp(),
    };

    // Si falló y alcanzó 3 intentos, bloquear usuario
    if (verificationStatus === "failed" && newAttempts >= 3) {
      updateData.isBlocked = true;
      updateData.identityVerificationStatus = "blocked";
      updateData.blockedReason = "Múltiples intentos fallidos en validación de identidad";
    }

    // Si fue exitoso, limpiar intentos
    if (verificationStatus === "verified") {
      updateData.identityVerificationAttempts = 0;
    }

    // Actualizar usuario en Firestore
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, updateData);

    console.log(
      `[IdentityVerification] Usuario ${userId} actualizado: ${verificationStatus}, intentos: ${newAttempts}`
    );

    // Redirigir al dashboard con parámetro de éxito
    const redirectUrl = new URL("/dashboard", request.nextUrl.origin);
    redirectUrl.searchParams.set("verification", verificationStatus === "verified" ? "success" : "failed");
    
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("[IdentityVerification] Error en callback:", error);
    // Redirigir a dashboard con mensaje de error
    const redirectUrl = new URL("/dashboard", request.nextUrl.origin);
    redirectUrl.searchParams.set("verification", "error");
    return NextResponse.redirect(redirectUrl);
  }
}

// Mantener POST para compatibilidad con webhooks (si Didit los usa)
export async function POST(request: NextRequest) {
  // Si Didit envía webhooks, procesarlos aquí
  // Por ahora, redirigir a GET handler
  return GET(request);
}

