import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/infrastructure/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { verifyTokenAndGetUserId } from "@/src/infrastructure/firebase/admin";

/**
 * Endpoint para iniciar verificación de identidad con Didit
 * Se ejecuta en el servidor para evitar problemas de CORS
 * Obtiene el userId desde el token de autenticación
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener token de autenticación desde el header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No autorizado. Token de autenticación requerido." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verificar token y obtener userId
    const userId = await verifyTokenAndGetUserId(token);

    if (!userId) {
      return NextResponse.json(
        { message: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Leer credenciales desde variables de entorno (sin NEXT_PUBLIC_ para seguridad)
    const appId =
      process.env.DIDIT_APP_ID || process.env.NEXT_PUBLIC_DIDIT_APP_ID;
    const apiKey =
      process.env.DIDIT_API_KEY || process.env.NEXT_PUBLIC_DIDIT_API_KEY;
    const workflowId =
      process.env.DIDIT_WORKFLOW_ID ||
      process.env.NEXT_PUBLIC_DIDIT_WORKFLOW_ID;

    // Validar parámetros requeridos (userId ya se obtuvo del token)
    const missingParams = [];
    if (!appId) missingParams.push("DIDIT_APP_ID");
    if (!apiKey) missingParams.push("DIDIT_API_KEY");
    if (!workflowId) missingParams.push("DIDIT_WORKFLOW_ID");

    if (missingParams.length > 0) {
      console.error("[Missing Parameters]:", missingParams);
      return NextResponse.json(
        {
          message: "Faltan parámetros requeridos",
          missingParams,
          hint: "Verifica que las variables de entorno DIDIT_APP_ID, DIDIT_API_KEY y DIDIT_WORKFLOW_ID estén configuradas",
        },
        { status: 400 }
      );
    }

    // TypeScript type guard: después de la validación, sabemos que estos valores son strings
    if (!appId || !apiKey || !workflowId) {
      return NextResponse.json(
        {
          message:
            "Error de configuración: credenciales de Didit no disponibles",
        },
        { status: 500 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { message: "Firestore no está inicializado" },
        { status: 500 }
      );
    }

    // Obtener datos del usuario
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // TypeScript type guard: después de la validación, sabemos que estos valores son strings
    const verifiedApiKey: string = apiKey;
    const verifiedAppId: string = appId;
    const verifiedWorkflowId: string = workflowId;

    // Construir callback URL
    const callbackUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    }/api/identity-verification/callback`;

    // Preparar payload para Didit API v2
    const payload = {
      workflow_id: verifiedWorkflowId,
      callback: callbackUrl,
      metadata: {
        user_id: userId,
        document_number: userData.documentNumber,
        email: userData.email,
        phone_number: userData.phoneNumber,
      },
    };

    console.log("[Didit Request]", {
      url: "https://api.didit.me/v2/verification-sessions",
      payload: { ...payload, metadata: { ...payload.metadata } }, // Log sin exponer datos sensibles
      hasApiKey: !!verifiedApiKey,
      apiKeyLength: verifiedApiKey.length,
      hasAppId: !!verifiedAppId,
      appIdLength: verifiedAppId.length,
      callbackUrl,
    });

    // Llamar a la API de Didit desde el servidor
    // Didit puede usar diferentes formatos de autenticación
    // Según documentación, puede ser X-API-Key o Authorization Bearer

    let diditResponse;
    try {
      // Intentar primero con X-API-Key (formato más común en APIs REST)
      const headers1: Record<string, string> = {
        "Content-Type": "application/json",
        "X-API-Key": verifiedApiKey,
        "X-App-Id": verifiedAppId,
      };

      console.log("[Didit Auth] Intentando con X-API-Key...");
      diditResponse = await fetch(
        "https://api.didit.me/v2/verification-sessions",
        {
          method: "POST",
          headers: headers1,
          body: JSON.stringify(payload),
        }
      );

      // Si falla con 401, intentar con Authorization Bearer
      if (diditResponse.status === 401) {
        console.log(
          "[Didit Auth] 401 recibido, intentando con Authorization Bearer..."
        );
        const headers2: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${verifiedApiKey}`,
          "X-App-Id": verifiedAppId,
        };

        diditResponse = await fetch(
          "https://api.didit.me/v2/verification-sessions",
          {
            method: "POST",
            headers: headers2,
            body: JSON.stringify(payload),
          }
        );
      }

      // Si aún falla, intentar solo con API Key sin App ID
      if (diditResponse.status === 401) {
        console.log(
          "[Didit Auth] Intentando solo con X-API-Key (sin X-App-Id)..."
        );
        const headers3: Record<string, string> = {
          "Content-Type": "application/json",
          "X-API-Key": verifiedApiKey,
        };

        diditResponse = await fetch(
          "https://api.didit.me/v2/verification-sessions",
          {
            method: "POST",
            headers: headers3,
            body: JSON.stringify(payload),
          }
        );
      }
    } catch (fetchError: any) {
      console.error("[Didit Fetch Error]:", fetchError);
      return NextResponse.json(
        {
          message: "Error de conexión con Didit API",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    // Leer el cuerpo de la respuesta antes de verificar el status
    let errorData;
    try {
      errorData = await diditResponse.json();
    } catch (parseError) {
      // Si no se puede parsear JSON, leer como texto
      const textError = await diditResponse.text();
      console.error("[Didit Response Text]:", textError);
      errorData = { message: textError || "Error desconocido de Didit API" };
    }

    if (!diditResponse.ok) {
      console.error("[Didit API Error]:", {
        status: diditResponse.status,
        statusText: diditResponse.statusText,
        error: errorData,
        headers: Object.fromEntries(diditResponse.headers.entries()),
      });

      // Mensaje específico para 401
      let errorMessage = errorData.message || errorData.error;
      if (diditResponse.status === 401) {
        errorMessage =
          errorMessage ||
          "Error de autenticación con Didit. Verifica que las credenciales (App ID y API Key) sean correctas.";
      } else {
        errorMessage =
          errorMessage ||
          `Error al iniciar validación de identidad (${diditResponse.status})`;
      }

      return NextResponse.json(
        {
          message: errorMessage,
          details: errorData,
          status: diditResponse.status,
        },
        { status: diditResponse.status }
      );
    }

    // Parsear respuesta exitosa
    let data;
    try {
      data = await diditResponse.json();
      console.log("[Didit Success Response]:", {
        hasId: !!data.id,
        hasVerificationUrl: !!data.verification_url,
        keys: Object.keys(data),
      });
    } catch (parseError) {
      const textResponse = await diditResponse.text();
      console.error("[Didit Response Parse Error]:", textResponse);
      return NextResponse.json(
        {
          message: "Error al procesar respuesta de Didit API",
          details: textResponse,
        },
        { status: 500 }
      );
    }

    // Extraer verificationSessionId y verification_url
    const verificationSessionId =
      data.id || data.verificationSessionId || data.session_id;
    const verification_url =
      data.verification_url || data.verificationUrl || data.url;

    if (!verificationSessionId || !verification_url) {
      console.error("[Didit Invalid Response]:", {
        data,
        verificationSessionId,
        verification_url,
      });
      return NextResponse.json(
        {
          message: "Respuesta inválida de Didit API",
          details: {
            receivedData: data,
            missingFields: {
              verificationSessionId: !verificationSessionId,
              verification_url: !verification_url,
            },
          },
        },
        { status: 500 }
      );
    }

    // Actualizar usuario con verificationSessionId
    await updateDoc(userDocRef, {
      identityVerificationWorkflowId: verificationSessionId,
      identityVerificationStatus: "pending",
      identityVerificationAttempts:
        (userData.identityVerificationAttempts || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      verificationSessionId,
      verification_url,
      status: "pending",
    });
  } catch (error: any) {
    console.error("[IdentityVerification] Error:", error);
    return NextResponse.json(
      {
        message:
          error.message ||
          "Error al iniciar el proceso de validación de identidad",
        error: error.toString(),
      },
      { status: 500 }
    );
  }
}
