import { NextRequest, NextResponse } from "next/server";
import { initializeAdmin, verifyTokenAndGetUserId } from "@/src/infrastructure/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin
initializeAdmin();

const STORAGE_BUCKET = "connect-tierra.firebasestorage.app";
const BROCHURE_FOLDER = "campaign_brochure";

// Helper function to get storage bucket
function getStorageBucket() {
  const app = getApps()[0];
  if (!app) {
    throw new Error("Firebase Admin no está inicializado");
  }
  return getStorage(app).bucket(STORAGE_BUCKET);
}

/**
 * GET - Get the download URL for a campaign brochure
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Verify token (handles both real Firebase tokens and mock tokens)
    const userId = await verifyTokenAndGetUserId(token);
    
    if (!userId) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 });
    }

    // Get campaignId from query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    // Get brochure URL using Admin SDK
    const bucket = getStorageBucket();
    const fileName = `${BROCHURE_FOLDER}/campaign_brochure_${campaignId}.pdf`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { message: "No se encontró el PDF de la propuesta" },
        { status: 404 }
      );
    }

    // Get signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error getting brochure:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener el PDF" },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload or replace a campaign brochure PDF
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Verify token (handles both real Firebase tokens and mock tokens)
    const userId = await verifyTokenAndGetUserId(token);
    
    if (!userId) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 });
    }

    // Check if user is ADMIN (only admins can upload brochures)
    // Note: You may need to check the user's role from Firestore
    // For now, we'll allow any authenticated user (you can add role check later)

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const campaignId = formData.get("campaignId") as string;

    if (!file) {
      return NextResponse.json(
        { message: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }

    // Upload the brochure using Admin SDK
    const bucket = getStorageBucket();
    const fileName = `${BROCHURE_FOLDER}/campaign_brochure_${campaignId}.pdf`;
    const storageFile = bucket.file(fileName);

    // Convert File (from FormData) to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file
    await storageFile.save(buffer, {
      metadata: {
        contentType: "application/pdf",
      },
    });

    // Make the file publicly readable (or get signed URL)
    await storageFile.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${STORAGE_BUCKET}/${fileName}`;

    return NextResponse.json({
      message: "PDF subido exitosamente",
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("Error uploading brochure:", error);
    return NextResponse.json(
      { message: error.message || "Error al subir el PDF" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a campaign brochure
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Verify token (handles both real Firebase tokens and mock tokens)
    const userId = await verifyTokenAndGetUserId(token);
    
    if (!userId) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 });
    }

    // Get campaignId from query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    // Delete the brochure using Admin SDK
    const bucket = getStorageBucket();
    const fileName = `${BROCHURE_FOLDER}/campaign_brochure_${campaignId}.pdf`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }

    return NextResponse.json({
      message: "PDF eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error deleting brochure:", error);
    return NextResponse.json(
      { message: error.message || "Error al eliminar el PDF" },
      { status: 500 }
    );
  }
}
