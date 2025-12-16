// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Default Firebase configuration (fallback values for connect-tierra project)
const DEFAULT_PROJECT_ID = "connect-tierra";
const DEFAULT_AUTH_DOMAIN = "connect-tierra.firebaseapp.com";
const DEFAULT_STORAGE_BUCKET = "connect-tierra.firebasestorage.app";
const DEFAULT_API_KEY = "AIzaSyA0Uodm14Z5rp2xo4QCULr5dwf7RngaWuc";
const DEFAULT_MESSAGING_SENDER_ID = "154649592138";
const DEFAULT_APP_ID = "1:154649592138:web:400f05f7287012e49741b3";
const DEFAULT_MEASUREMENT_ID = "G-Z7V9RRVVL1";

// Helper function to get environment variable with fallback
function getEnvVar(key: string, fallback?: string): string {
  // Check process.env first (available at build time for NEXT_PUBLIC_* vars)
  const envValue = process.env[key];
  if (envValue) {
    return envValue;
  }

  // Client-side: check runtime injection points
  if (typeof window !== "undefined") {
    const runtimeValue =
      (window as any).__ENV__?.[key] ||
      (window as any).__NEXT_DATA__?.env?.[key];
    if (runtimeValue) {
      return runtimeValue;
    }
  }

  // Return fallback if provided
  return fallback || "";
}

// Validate and build Firebase configuration
function getFirebaseConfig() {
  // Get values with fallbacks for critical fields
  const apiKey = getEnvVar("NEXT_PUBLIC_API_KEY", DEFAULT_API_KEY);
  const authDomain = getEnvVar("NEXT_PUBLIC_AUTH_DOMAIN", DEFAULT_AUTH_DOMAIN);
  const projectId = getEnvVar("NEXT_PUBLIC_PROJECT_ID", DEFAULT_PROJECT_ID);
  const storageBucket = getEnvVar(
    "NEXT_PUBLIC_STORAGE_BUCKET",
    DEFAULT_STORAGE_BUCKET
  );
  const messagingSenderId = getEnvVar(
    "NEXT_PUBLIC_MESSAGING_SENDER_ID",
    DEFAULT_MESSAGING_SENDER_ID
  );
  const appId = getEnvVar("NEXT_PUBLIC_APP_ID", DEFAULT_APP_ID);
  const measurementId = getEnvVar(
    "NEXT_PUBLIC_MEASUREMENT_ID",
    DEFAULT_MEASUREMENT_ID
  );

  // Validate that we have all required fields (should always pass with fallbacks)
  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };

  // Double-check that projectId is present (this is the critical one causing the error)
  if (!config.projectId) {
    const errorMessage = `Firebase projectId is missing. This is a critical configuration error.`;
    console.error(errorMessage, {
      availableEnvVars: Object.keys(process.env).filter((k) =>
        k.startsWith("NEXT_PUBLIC_")
      ),
      config: {
        ...config,
        apiKey: config.apiKey ? "✓" : "✗",
        projectId: config.projectId ? "✓" : "✗",
      },
    });
    throw new Error(errorMessage);
  }

  return config;
}

// Your web app's Firebase configuration
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined") {
  // Only initialize Firebase on client side
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    app = getApps()[0];
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} else {
  // Server-side: create app without analytics
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
  }
}

export { app, analytics, auth, db };
