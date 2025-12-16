import { User } from "@/src/domain/entities/User";

/**
 * Aplica máscaras DLP (Data Loss Prevention) a datos sensibles
 */
function applyDLPMasks(user: User): {
  phoneNumber: string;
  documentNumber: string;
} {
  // Máscara para teléfono: mostrar solo últimos 4 dígitos
  const phoneMask = (phone?: string): string => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) return "***";
    return `***${digits.slice(-4)}`;
  };

  // Máscara para documento: mostrar solo últimos 3 dígitos
  const documentMask = (doc?: string): string => {
    if (!doc) return "";
    const digits = doc.replace(/\D/g, "");
    if (digits.length <= 3) return "***";
    return `***${digits.slice(-3)}`;
  };

  return {
    phoneNumber: phoneMask(user.phoneNumber),
    documentNumber: documentMask(user.documentNumber),
  };
}

/**
 * Escapa valores para CSV (maneja comillas y comas)
 */
function escapeCSVValue(
  value: string | number | boolean | undefined | null
): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  // Si contiene comillas, comas o saltos de línea, envolver en comillas y escapar comillas
  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convierte un array de usuarios a formato CSV
 */
export function usersToCSV(users: User[]): string {
  if (users.length === 0) {
    return "No hay datos para exportar";
  }

  // Definir columnas del CSV
  const headers = [
    "ID",
    "Nombre",
    "Teléfono",
    "Documento",
    "Rol",
    "País",
    "Departamento",
    "Ciudad",
    "Dirección",
    "Barrio/Vereda",
    "Tipo de Área",
    "Desde Capital",
    "Líder",
    "Participantes",
    "Fecha de Registro",
  ];

  // Crear filas de datos
  const rows = users.map((user) => {
    // Mapear roles a español para mejor legibilidad
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "Super Administrador",
      ADMIN: "Administrador",
      COORDINATOR: "Coordinador",
      LINK: "Enlace",
      MULTIPLIER: "Multiplicador",
      FOLLOWER: "Seguidor",
    };

    return [
      user.id,
      user.name || "",
      user.phoneNumber || "",
      user.documentNumber || "",
      roleMap[user.role || ""] || user.role || "",
      user.country || "",
      user.department || "",
      user.city || "",
      user.address || "",
      user.neighborhood || "",
      user.areaType === "URBAN"
        ? "Urbano"
        : user.areaType === "RURAL"
        ? "Rural"
        : "",
      user.fromCapitalCity ? "Sí" : "No",
      user.participants && user.participants > 0 ? "Sí" : "No",
      user.participants?.toString() || "0",
      user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("es-CO")
        : "",
    ].map(escapeCSVValue);
  });

  // Combinar headers y rows
  const csvLines = [
    headers.map(escapeCSVValue).join(","),
    ...rows.map((row) => row.join(",")),
  ];

  return csvLines.join("\n");
}

/**
 * Descarga un archivo CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Crear blob con BOM UTF-8 para Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Crear URL temporal
  const url = URL.createObjectURL(blob);

  // Crear elemento <a> temporal para descargar
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  // Agregar al DOM, hacer click y remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpiar URL temporal después de un delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
