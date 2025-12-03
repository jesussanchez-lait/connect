# Credenciales de Prueba - CONNECT

Este documento contiene las credenciales de prueba para cada tipo de rol en el sistema CONNECT.

## Cómo Usar

1. Ve a la página de login: `http://localhost:3000/login`
2. Ingresa el número de teléfono correspondiente al rol que deseas probar
3. Ingresa el código OTP de 6 dígitos (en desarrollo, se muestra en pantalla)

## Credenciales por Rol

### 🔧 SUPER_ADMIN (Soporte Técnico)

**Teléfono:** `3000000001`  
**OTP:** `000001`  
**Rol:** `SUPER_ADMIN`  
**Acceso:** Gestión completa del sistema

**Funcionalidades:**

- Gestión de parámetros globales
- Carga de Divipol (Puestos de Votación)
- Auditoría forense de seguridad
- Gestión de usuarios del sistema

---

### 👔 ADMIN (Dirección)

**Teléfono:** `3000000002`  
**OTP:** `000002`  
**Rol:** `ADMIN`  
**Nombre:** Pedro Javier Jimenez Bahamon  
**Acceso:** Todas las campañas

**Funcionalidades:**

- Vista completa de todas las campañas
- Métricas globales
- Exportación de datos con máscaras DLP
- Gestión de presupuesto operativo
- Configuración de narrativa y estrategia política

---

### 🛡️ COORDINATOR (Coordinador - "El Auditor")

**Teléfono:** `3000000003`  
**OTP:** `000003`  
**Rol:** `COORDINATOR`  
**Nombre:** María González  
**Zona:** Departamento Cundinamarca

**Funcionalidades:**

- Resolución de conflictos y alertas de fraude
- Aprobación de "Divorcios" (reasignaciones)
- Reasignaciones masivas dentro de su zona
- Auditoría de datos e integridad
- Vista de estructura jerárquica completa
- Métricas de crecimiento de su zona

---

### 🔗 LINK (Enlace Municipal - "El Activador")

**Teléfono:** `3000000004`  
**OTP:** `000004`  
**Rol:** `LINK`  
**Nombre:** Carlos Rodríguez  
**Zona:** Bogotá - Comuna 1

**Funcionalidades:**

- Gestión de zonas y convocatoria de eventos
- Validación de líderes (Prueba de Vida)
- Entrega de material impreso (QRs)
- Capacitación de nuevos Multiplicadores
- Vista de Multiplicadores bajo su gestión
- Métricas de activación por zona

**Nota:** Este rol opera principalmente desde móvil (90%)

---

### ⚡ MULTIPLIER (Multiplicador)

**Teléfono:** `3000000005`  
**OTP:** `000005`  
**Rol:** `MULTIPLIER`  
**Nombre:** Ana Martínez  
**Seguidores:** 15 seguidores en mock

**Funcionalidades:**

- Código QR propio para compartir
- Lista de seguidores reclutados
- Mapa de su red descendente
- Métricas de crecimiento de su red
- Historial de actividades de reclutamiento
- Compartir QR en redes sociales
- Agregar miembros manualmente al equipo

---

### 👤 FOLLOWER (Seguidor)

**Teléfono:** `3000000006`  
**OTP:** `000006`  
**Rol:** `FOLLOWER`  
**Nombre:** Juan Pérez  
**Líder:** Vinculado a Multiplicador Ana Martínez

**Funcionalidades:**

- Vista de solo lectura
- Información de su multiplicador/líder
- Su información personal
- Sin capacidad de reclutar (sin hijos)
- Sin código QR propio
- Vista limitada de actividades

---

## Estructura Jerárquica Mock

```
ADMIN (Pedro)
  └── COORDINATOR (María) - Cundinamarca
      └── LINK (Carlos) - Bogotá
          └── MULTIPLIER (Ana)
              └── FOLLOWER (Juan y otros 14 seguidores)
```

## Notas Importantes

1. **En Desarrollo:** Los códigos OTP se muestran en pantalla después de enviar el código
2. **Mocks Activados:** Por defecto, el sistema usa mocks. Para desactivarlos, configura `NEXT_PUBLIC_USE_MOCKS=false` en `.env.local`
3. **Datos Consistentes:** Los mocks mantienen relaciones jerárquicas consistentes entre endpoints
4. **Roles en Código:** Los roles se almacenan en inglés (`MULTIPLIER`, `FOLLOWER`, etc.) pero se muestran en español en la UI

## Pruebas Recomendadas

### Para probar MULTIPLIER:

1. Login con `3000000005` / `000005`
2. Verificar que aparece el código QR
3. Verificar lista de 15 seguidores
4. Verificar mapa con ubicaciones
5. Probar agregar nuevo miembro

### Para probar COORDINATOR:

1. Login con `3000000003` / `000003`
2. Verificar alertas de fraude pendientes
3. Verificar solicitudes de divorcio
4. Probar aprobar/rechazar divorcios

### Para probar LINK:

1. Login con `3000000004` / `000004`
2. Verificar lista de multiplicadores bajo gestión
3. Verificar métricas de activación

### Para probar FOLLOWER:

1. Login con `3000000006` / `000006`
2. Verificar vista de solo lectura
3. Verificar información del multiplicador
4. Verificar que NO aparece código QR

### Para probar ADMIN:

1. Login con `3000000002` / `000002`
2. Verificar vista de todas las campañas
3. Verificar métricas globales
4. Probar exportación de datos
