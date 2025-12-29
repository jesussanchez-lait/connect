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

// Formatear cédula colombiana agrupando de derecha a izquierda en grupos de 3
// Ejemplos: 1111111 -> 1.111.111, 33333333 -> 33.333.333, 1000000000 -> 1.000.000.000
export function formatColombianId(id: string): string {
  const cleanId = id.replace(/\D/g, "");

  if (cleanId.length <= 3) return cleanId;

  // Agrupar de derecha a izquierda en grupos de 3 dígitos
  const groups: string[] = [];
  let remaining = cleanId;

  // Mientras haya dígitos, tomar grupos de 3 desde la derecha
  while (remaining.length > 3) {
    groups.unshift(remaining.slice(-3)); // Agregar al inicio del array
    remaining = remaining.slice(0, -3);
  }

  // Agregar el grupo restante (puede tener 1, 2 o 3 dígitos)
  if (remaining.length > 0) {
    groups.unshift(remaining);
  }

  return groups.join(".");
}
