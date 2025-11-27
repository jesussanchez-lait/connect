// Validación de cédula colombiana
export function validateColombianId(id: string): boolean {
  // Remover espacios y caracteres especiales
  const cleanId = id.replace(/\D/g, "");

  // La cédula colombiana tiene entre 7 y 10 dígitos
  if (cleanId.length < 7 || cleanId.length > 10) {
    return false;
  }

  // Validación básica: solo números y longitud válida
  return /^\d{7,10}$/.test(cleanId);
}

// Formatear cédula colombiana (xxx.xxx.xxx-x)
export function formatColombianId(id: string): string {
  const cleanId = id.replace(/\D/g, "");

  if (cleanId.length <= 3) return cleanId;
  if (cleanId.length <= 6) return `${cleanId.slice(0, 3)}.${cleanId.slice(3)}`;
  if (cleanId.length <= 9) {
    return `${cleanId.slice(0, 3)}.${cleanId.slice(3, 6)}.${cleanId.slice(6)}`;
  }
  return `${cleanId.slice(0, 3)}.${cleanId.slice(3, 6)}.${cleanId.slice(
    6,
    9
  )}-${cleanId.slice(9)}`;
}
