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

    // Leer credenciales desde variables de entorno según documentación de Didit
    // https://docs.didit.me/reference/api-full-flow
    const apiKey =
      process.env.DIDIT_API_KEY || process.env.NEXT_PUBLIC_DIDIT_API_KEY;
    const workflowId =
      process.env.DIDIT_WORKFLOW_ID ||
      process.env.NEXT_PUBLIC_DIDIT_WORKFLOW_ID;

    // Validar parámetros requeridos (userId ya se obtuvo del token)
    // Según documentación, solo necesitamos API_KEY y workflow_id
    const missingParams = [];
    if (!apiKey) missingParams.push("DIDIT_API_KEY");
    if (!workflowId) missingParams.push("DIDIT_WORKFLOW_ID");

    if (missingParams.length > 0) {
      console.error("[Missing Parameters]:", missingParams);
      return NextResponse.json(
        {
          message: "Faltan parámetros requeridos",
          missingParams,
          hint: "Verifica que las variables de entorno DIDIT_API_KEY y DIDIT_WORKFLOW_ID estén configuradas",
        },
        { status: 400 }
      );
    }

    // TypeScript type guard: después de la validación, sabemos que estos valores son strings
    if (!apiKey || !workflowId) {
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
    const verifiedWorkflowId: string = workflowId;

    // Construir callback URL según documentación
    const callbackUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    }/api/identity-verification/callback`;

    // Preparar payload según documentación oficial de Didit
    // https://docs.didit.me/reference/api-full-flow
    const payload: {
      workflow_id: string;
      callback: string;
      vendor_data: string;
      metadata?: Record<string, unknown>;
      contact_details?: {
        email?: string;
        email_lang?: string;
        phone?: string;
      };
    } = {
      workflow_id: verifiedWorkflowId,
      callback: callbackUrl,
      vendor_data: userId, // Identificador del usuario en nuestro sistema
    };

    // Agregar metadata si hay datos disponibles
    if (userData.documentNumber) {
      payload.metadata = {
        user_id: userId,
        document_number: userData.documentNumber,
      };
    }

    // Agregar contact_details si hay email o teléfono
    if (userData.email || userData.phoneNumber) {
      payload.contact_details = {};
      if (userData.email) {
        payload.contact_details.email = userData.email;
        payload.contact_details.email_lang = "es"; // Español por defecto
      }
      if (userData.phoneNumber) {
        payload.contact_details.phone = userData.phoneNumber;
      }
    }

    console.log("[Didit Request]", {
      url: "https://verification.didit.me/v2/session/",
      payload: {
        workflow_id: payload.workflow_id,
        callback: payload.callback,
        vendor_data: payload.vendor_data,
        hasMetadata: !!payload.metadata,
        hasContactDetails: !!payload.contact_details,
      },
      hasApiKey: !!verifiedApiKey,
      apiKeyLength: verifiedApiKey.length,
      callbackUrl,
    });

    // Llamar a la API de Didit según documentación oficial
    // Endpoint: POST /v2/session/
    // Host: verification.didit.me
    // Header: X-Api-Key (no X-API-Key)
    let diditResponse;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Api-Key": verifiedApiKey, // Según documentación: X-Api-Key (no X-API-Key)
      };

      console.log("[Didit] Creando sesión de verificación...");
      diditResponse = await fetch("https://verification.didit.me/v2/session/", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
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

    // Leer el cuerpo de la respuesta UNA SOLA VEZ
    // El body solo se puede leer una vez, así que lo hacemos antes de verificar el status
    let responseData: any;
    let responseText: string | null = null;

    try {
      // Intentar parsear como JSON
      responseData = await diditResponse.json();
    } catch (parseError) {
      // Si falla, leer como texto (pero esto consume el body)
      try {
        responseText = await diditResponse.text();
        console.error("[Didit Response Text]:", responseText);
        // Intentar parsear el texto como JSON si es posible
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = {
            message: responseText || "Error desconocido de Didit API",
          };
        }
      } catch (textError) {
        console.error("[Didit Response Read Error]:", textError);
        responseData = { message: "Error al leer respuesta de Didit API" };
      }
    }

    // Ahora verificar si la respuesta fue exitosa
    if (!diditResponse.ok) {
      console.error("[Didit API Error]:", {
        status: diditResponse.status,
        statusText: diditResponse.statusText,
        error: responseData,
        headers: Object.fromEntries(diditResponse.headers.entries()),
      });

      // Mensaje específico para 401
      let errorMessage = responseData.message || responseData.error;
      if (diditResponse.status === 401) {
        errorMessage =
          errorMessage ||
          "Error de autenticación con Didit. Verifica que la API Key sea correcta.";
      } else {
        errorMessage =
          errorMessage ||
          `Error al iniciar validación de identidad (${diditResponse.status})`;
      }

      return NextResponse.json(
        {
          message: errorMessage,
          details: responseData,
          status: diditResponse.status,
        },
        { status: diditResponse.status }
      );
    }

    // Si llegamos aquí, la respuesta fue exitosa
    const data = responseData;
    console.log("[Didit Success Response]:", {
      hasSessionId: !!data.session_id,
      hasUrl: !!data.url,
      keys: Object.keys(data),
    });

    // Extraer datos de la respuesta según documentación
    // La respuesta incluye: session_id, url, session_token, session_number, etc.
    const sessionId = data.session_id;
    const verificationUrl = data.url; // URL para redirigir al usuario
    const sessionToken = data.session_token;
    const sessionNumber = data.session_number;
    const status = data.status; // "Not Started", "In Progress", etc.

    if (!sessionId || !verificationUrl) {
      console.error("[Didit Invalid Response]:", {
        data,
        sessionId,
        verificationUrl,
        keys: Object.keys(data),
      });
      return NextResponse.json(
        {
          message: "Respuesta inválida de Didit API",
          details: {
            receivedData: data,
            missingFields: {
              session_id: !sessionId,
              url: !verificationUrl,
            },
          },
        },
        { status: 500 }
      );
    }

    console.log("[Didit Success]", {
      sessionId,
      sessionNumber,
      status,
      hasUrl: !!verificationUrl,
    });

    // Actualizar usuario con session_id
    await updateDoc(userDocRef, {
      identityVerificationWorkflowId: sessionId, // Guardamos session_id
      identityVerificationStatus: "pending",
      identityVerificationAttempts:
        (userData.identityVerificationAttempts || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      verificationSessionId: sessionId, // Mantener compatibilidad con código existente
      verification_url: verificationUrl, // URL para redirigir al usuario
      session_id: sessionId,
      session_token: sessionToken,
      session_number: sessionNumber,
      status: status || "pending",
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
