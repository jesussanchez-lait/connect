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

interface DiditCallbackPayload {
  workflowId: string;
  status: "pending" | "in_progress" | "verified" | "failed" | "expired";
  userId?: string;
  result?: {
    verified: boolean;
    score?: number;
    details?: Record<string, unknown>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiditCallbackPayload = await request.json();

    if (!body.workflowId) {
      return NextResponse.json(
        { message: "workflowId es requerido" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { message: "Firestore no está inicializado" },
        { status: 500 }
      );
    }

    // Buscar usuario por workflowId
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("identityVerificationWorkflowId", "==", body.workflowId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(
        `[IdentityVerification] No se encontró usuario con workflowId: ${body.workflowId}`
      );
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Mapear estado de Didit a nuestro formato
    let verificationStatus: "pending" | "verified" | "failed" | "blocked" =
      "pending";
    if (body.status === "verified") {
      verificationStatus = "verified";
    } else if (body.status === "failed") {
      verificationStatus = "failed";
    } else if (body.status === "expired") {
      verificationStatus = "failed";
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

    return NextResponse.json({
      success: true,
      message: "Estado de validación actualizado",
      userId,
      status: verificationStatus,
    });
  } catch (error: any) {
    console.error("[IdentityVerification] Error en callback:", error);
    return NextResponse.json(
      { message: "Error al procesar callback", error: error.message },
      { status: 500 }
    );
  }
}

