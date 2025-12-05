// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0Uodm14Z5rp2xo4QCULr5dwf7RngaWuc",
  authDomain: "connect-tierra.firebaseapp.com",
  projectId: "connect-tierra",
  storageBucket: "connect-tierra.firebasestorage.app",
  messagingSenderId: "154649592138",
  appId: "1:154649592138:web:400f05f7287012e49741b3",
  measurementId: "G-Z7V9RRVVL1",
};

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  // Only initialize Firebase on client side
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
  } else {
    app = getApps()[0];
    analytics = getAnalytics(app);
  }
} else {
  // Server-side: create app without analytics
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
}

export { app, analytics };
