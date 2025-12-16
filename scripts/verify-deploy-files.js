#!/usr/bin/env node

/**
 * Script para verificar que solo se desplieguen archivos estáticos de Next.js
 */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "../out");
const IGNORE_PATTERNS = [
  /\/\./,
  /\/server\//,
  /\/types\//,
  /\/cache\//,
  /\.txt$/,
  /\/trace$/,
  /node_modules/,
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(OUT_DIR, filePath);

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      if (!shouldIgnore(relativePath)) {
        fileList.push(relativePath);
      }
    }
  });

  return fileList;
}

console.log("🔍 Verificando archivos para despliegue...\n");

if (!fs.existsSync(OUT_DIR)) {
  console.error(
    "❌ El directorio 'out' no existe. Ejecuta 'npm run build:firebase' primero."
  );
  process.exit(1);
}

const files = getAllFiles(OUT_DIR);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const jsFiles = files.filter((f) => f.endsWith(".js"));
const cssFiles = files.filter((f) => f.endsWith(".css"));
const otherFiles = files.filter(
  (f) => !f.endsWith(".html") && !f.endsWith(".js") && !f.endsWith(".css")
);

console.log(`✅ Total de archivos a desplegar: ${files.length}\n`);
console.log(`📄 HTML: ${htmlFiles.length}`);
console.log(`📜 JavaScript: ${jsFiles.length}`);
console.log(`🎨 CSS: ${cssFiles.length}`);
console.log(`📦 Otros: ${otherFiles.length}\n`);

// Verificar archivos críticos
const criticalFiles = ["index.html", "404.html"];
const pwaFiles = ["manifest.json", "sw.js", "browserconfig.xml"];
const allCriticalFiles = [...criticalFiles, ...pwaFiles];
const missingFiles = allCriticalFiles.filter((file) => !files.includes(file));

if (missingFiles.length > 0) {
  console.error(`❌ Archivos críticos faltantes: ${missingFiles.join(", ")}`);
  process.exit(1);
}

console.log("✅ Archivos críticos presentes:");
criticalFiles.forEach((file) => {
  console.log(`   - ${file}`);
});

console.log("\n✅ Archivos PWA presentes:");
pwaFiles.forEach((file) => {
  console.log(`   - ${file}`);
});

console.log("\n📋 Archivos HTML generados:");
htmlFiles.forEach((file) => {
  console.log(`   - ${file}`);
});

console.log("\n✅ Verificación completada. Listo para desplegar.");
console.log("\n💡 Para desplegar ejecuta:");
console.log("   firebase deploy --only hosting:connect-tierra-demo");
