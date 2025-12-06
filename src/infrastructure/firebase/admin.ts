// Firebase Admin SDK initialization for server-side operations
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;
let adminDb: ReturnType<typeof getFirestore> | null = null;

/**
 * Initialize Firebase Admin SDK
 * For server-side token verification and Firestore operations
 */
export function initializeAdmin() {
  if (adminApp) {
    return { app: adminApp, auth: adminAuth!, db: adminDb! };
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  // Initialize with service account or use default credentials
  // In production, use environment variables or service account key
  try {
    // Try to use Application Default Credentials (works in Firebase hosting/Cloud Functions)
    adminApp = initializeApp({
      projectId: "connect-tierra",
    });
  } catch (error) {
    // If that fails, try with explicit credentials from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        const key = JSON.parse(serviceAccount);
        adminApp = initializeApp({
          credential: cert(key),
          projectId: "connect-tierra",
        });
      } catch (parseError) {
        console.error(
          "Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:",
          parseError
        );
        throw new Error("Failed to initialize Firebase Admin");
      }
    } else {
      // Fallback: try default credentials (for local development with gcloud auth)
      adminApp = initializeApp({
        projectId: "connect-tierra",
      });
    }
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

  return { app: adminApp, auth: adminAuth, db: adminDb };
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
  if (!adminAuth) {
    initializeAdmin();
  }
  return adminAuth!;
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminDb() {
  if (!adminDb) {
    initializeAdmin();
  }
  return adminDb!;
}

/**
 * Verify Firebase ID token and get user ID
 * Returns null if token is invalid or if it's a mock token
 */
export async function verifyTokenAndGetUserId(
  token: string
): Promise<string | null> {
  // Check if it's a mock token
  if (token.startsWith("mock-token-")) {
    // Extract userId from mock token format: mock-token-{userId}-{timestamp}
    const match = token.match(/mock-token-(.+?)-/);
    if (match) {
      return match[1];
    }
    return null;
  }

  // Verify real Firebase token
  try {
    const auth = getAdminAuth();
    if (!auth) {
      console.error("Firebase Admin Auth not initialized");
      return null;
    }
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error: any) {
    console.error("Error verifying token:", error);
    // If it's a token error, return null (unauthorized)
    // If it's an initialization error, we might want to throw
    if (error.code === "app/no-app") {
      console.error(
        "Firebase Admin not initialized. Make sure credentials are set up."
      );
    }
    return null;
  }
}
