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
 * Callback de Didit según documentación: https://docs.didit.me/reference/api-full-flow
 * Didit redirige al usuario aquí después de completar la verificación
 * Query parameters: session_id y status
 */
export async function GET(request: NextRequest) {
  try {
    // Manejar redirect después de completar verificación
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id") || searchParams.get("verificationSessionId");
    const status = searchParams.get("status");

    if (!sessionId) {
      return NextResponse.json(
        { message: "session_id es requerido" },
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

    // Buscar usuario por session_id (almacenado como identityVerificationWorkflowId)
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("identityVerificationWorkflowId", "==", sessionId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(
        `[IdentityVerification] No se encontró usuario con session_id: ${sessionId}`
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

// No se manejan webhooks - solo redirects GET

