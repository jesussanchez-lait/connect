#!/usr/bin/env node

/**
 * Script para preparar el build de Firebase Hosting
 * Mueve temporalmente las rutas API fuera del directorio app para que Next.js pueda hacer export estático
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "../app/api");
const TEMP_API_DIR = path.join(__dirname, "../.temp-api");

// Crear directorio temporal si no existe
if (!fs.existsSync(path.join(__dirname, "../.temp"))) {
  fs.mkdirSync(path.join(__dirname, "../.temp"), { recursive: true });
}

// Mover rutas API a directorio temporal
if (fs.existsSync(API_DIR)) {
  console.log("📦 Moviendo rutas API a directorio temporal...");

  // Eliminar directorio temporal si existe
  if (fs.existsSync(TEMP_API_DIR)) {
    fs.rmSync(TEMP_API_DIR, { recursive: true, force: true });
  }

  // Mover API a temporal
  fs.renameSync(API_DIR, TEMP_API_DIR);
  console.log("✅ Rutas API movidas temporalmente");
} else {
  console.log("⚠️  No se encontró directorio app/api");
}

console.log(
  "✅ Preparación completada. Puedes ejecutar: npm run build:firebase"
);
