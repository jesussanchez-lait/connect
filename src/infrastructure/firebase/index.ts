// Firebase exports
export { app, analytics, auth, db } from "./config";
export { FirebaseDataSource } from "./FirebaseDataSource";

// Re-export commonly used Firebase modules
export type { FirebaseApp } from "firebase/app";
export type { Analytics } from "firebase/analytics";
export type { Auth } from "firebase/auth";
export type { Firestore } from "firebase/firestore";
