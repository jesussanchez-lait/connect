#!/usr/bin/env node

/**
 * Script para restaurar las rutas API después del build
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "../app/api");
const TEMP_API_DIR = path.join(__dirname, "../.temp-api");

// Restaurar rutas API
if (fs.existsSync(TEMP_API_DIR)) {
  console.log("📦 Restaurando rutas API...");

  // Eliminar directorio API si existe
  if (fs.existsSync(API_DIR)) {
    fs.rmSync(API_DIR, { recursive: true, force: true });
  }

  // Mover de vuelta
  fs.renameSync(TEMP_API_DIR, API_DIR);
  console.log("✅ Rutas API restauradas");
} else {
  console.log("⚠️  No se encontró directorio temporal de API");
}
