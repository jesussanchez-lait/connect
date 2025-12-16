// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

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
