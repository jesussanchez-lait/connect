// Mock Data para desarrollo - Datos consistentes y realistas

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  COORDINATOR: "COORDINATOR",
  LINK: "LINK",
  MULTIPLIER: "MULTIPLIER",
  FOLLOWER: "FOLLOWER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// Credenciales de prueba por rol
export const MOCK_CREDENTIALS = {
  SUPER_ADMIN: { phoneNumber: "3000000001", otp: "000001" },
  ADMIN: { phoneNumber: "3000000002", otp: "000002" },
  COORDINATOR: { phoneNumber: "3000000003", otp: "000003" },
  LINK: { phoneNumber: "3000000004", otp: "000004" },
  MULTIPLIER: { phoneNumber: "3000000005", otp: "000005" },
  FOLLOWER: { phoneNumber: "3000000006", otp: "000006" },
};

// Usuarios mock con datos completos
export const MOCK_USERS = {
  SUPER_ADMIN: {
    id: "user-super-admin-1",
    name: "Soporte Técnico",
    phoneNumber: "3000000001",
    email: "soporte@connect.com",
    role: ROLES.SUPER_ADMIN,
    documentNumber: "1234567890",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "Centro",
    createdAt: new Date("2024-01-01"),
  },
  ADMIN: {
    id: "user-admin-1",
    name: "Pedro Javier Jimenez Bahamon",
    phoneNumber: "3000000002",
    email: "pedro@campana.com",
    role: ROLES.ADMIN,
    documentNumber: "1234567891",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "Chapinero",
    createdAt: new Date("2024-01-02"),
  },
  COORDINATOR: {
    id: "user-coordinator-1",
    name: "María González",
    phoneNumber: "3000000003",
    email: "maria@campana.com",
    role: ROLES.COORDINATOR,
    documentNumber: "1234567892",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "Usaquén",
    createdAt: new Date("2024-01-03"),
  },
  LINK: {
    id: "user-link-1",
    name: "Carlos Rodríguez",
    phoneNumber: "3000000004",
    email: "carlos@campana.com",
    role: ROLES.LINK,
    documentNumber: "1234567893",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "La Candelaria",
    createdAt: new Date("2024-01-04"),
  },
  MULTIPLIER: {
    id: "user-multiplier-1",
    name: "Ana Martínez",
    phoneNumber: "3000000005",
    email: "ana@campana.com",
    role: ROLES.MULTIPLIER,
    documentNumber: "1234567894",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "Kennedy",
    latitude: 4.6097,
    longitude: -74.0817,
    createdAt: new Date("2024-01-05"),
  },
  FOLLOWER: {
    id: "user-follower-1",
    name: "Juan Pérez",
    phoneNumber: "3000000006",
    email: "juan@campana.com",
    role: ROLES.FOLLOWER,
    documentNumber: "1234567895",
    country: "Colombia",
    department: "Cundinamarca",
    city: "Bogotá",
    neighborhood: "Suba",
    latitude: 4.75,
    longitude: -74.1,
    leaderId: "user-multiplier-1",
    leaderName: "Ana Martínez",
    createdAt: new Date("2024-01-10"),
  },
};

// Campañas mock
export const MOCK_CAMPAIGNS = [
  {
    id: "campaign-1",
    name: "Campaña Presidencial 2026",
    description: "Campaña nacional para elecciones presidenciales",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2026-05-31"),
    status: "active",
    participants: 1250,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "campaign-2",
    name: "Campaña Alcaldía Bogotá",
    description: "Campaña local para alcaldía de Bogotá",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2025-10-31"),
    status: "active",
    participants: 850,
    createdAt: new Date("2024-02-01"),
  },
];

// Equipos mock - Jerarquía: MULTIPLIER > FOLLOWER
export const MOCK_TEAM_MEMBERS = {
  // Seguidores del MULTIPLIER (Ana Martínez)
  multiplierTeam: [
    {
      id: "member-1",
      name: "Juan Pérez",
      phoneNumber: "3000000006",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Suba",
      latitude: 4.75,
      longitude: -74.1,
      teamSize: 0, // Es FOLLOWER, no tiene hijos
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "member-2",
      name: "Laura Sánchez",
      phoneNumber: "3000000007",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Kennedy",
      latitude: 4.62,
      longitude: -74.09,
      teamSize: 0,
      createdAt: new Date("2024-01-12"),
    },
    {
      id: "member-3",
      name: "Roberto Gómez",
      phoneNumber: "3000000008",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Bosa",
      latitude: 4.61,
      longitude: -74.19,
      teamSize: 0,
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "member-4",
      name: "Carmen López",
      phoneNumber: "3000000009",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Engativá",
      latitude: 4.7,
      longitude: -74.11,
      teamSize: 0,
      createdAt: new Date("2024-01-18"),
    },
    {
      id: "member-5",
      name: "Diego Ramírez",
      phoneNumber: "3000000010",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Fontibón",
      latitude: 4.68,
      longitude: -74.15,
      teamSize: 0,
      createdAt: new Date("2024-01-20"),
    },
    {
      id: "member-6",
      name: "Sandra Torres",
      phoneNumber: "3000000011",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Usme",
      latitude: 4.5,
      longitude: -74.08,
      teamSize: 0,
      createdAt: new Date("2024-01-22"),
    },
    {
      id: "member-7",
      name: "Miguel Herrera",
      phoneNumber: "3000000012",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Ciudad Bolívar",
      latitude: 4.58,
      longitude: -74.12,
      teamSize: 0,
      createdAt: new Date("2024-01-25"),
    },
    {
      id: "member-8",
      name: "Patricia Vargas",
      phoneNumber: "3000000013",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Rafael Uribe",
      latitude: 4.56,
      longitude: -74.1,
      teamSize: 0,
      createdAt: new Date("2024-01-28"),
    },
    {
      id: "member-9",
      name: "Andrés Morales",
      phoneNumber: "3000000014",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "San Cristóbal",
      latitude: 4.54,
      longitude: -74.09,
      teamSize: 0,
      createdAt: new Date("2024-02-01"),
    },
    {
      id: "member-10",
      name: "Lucía Fernández",
      phoneNumber: "3000000015",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Santa Fe",
      latitude: 4.6,
      longitude: -74.07,
      teamSize: 0,
      createdAt: new Date("2024-02-03"),
    },
    {
      id: "member-11",
      name: "Fernando Castro",
      phoneNumber: "3000000016",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Los Mártires",
      latitude: 4.59,
      longitude: -74.08,
      teamSize: 0,
      createdAt: new Date("2024-02-05"),
    },
    {
      id: "member-12",
      name: "Gloria Ruiz",
      phoneNumber: "3000000017",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Antonio Nariño",
      latitude: 4.57,
      longitude: -74.09,
      teamSize: 0,
      createdAt: new Date("2024-02-07"),
    },
    {
      id: "member-13",
      name: "Ricardo Peña",
      phoneNumber: "3000000018",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Puente Aranda",
      latitude: 4.63,
      longitude: -74.1,
      teamSize: 0,
      createdAt: new Date("2024-02-10"),
    },
    {
      id: "member-14",
      name: "Mónica Díaz",
      phoneNumber: "3000000019",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "La Candelaria",
      latitude: 4.59,
      longitude: -74.07,
      teamSize: 0,
      createdAt: new Date("2024-02-12"),
    },
    {
      id: "member-15",
      name: "Jorge Silva",
      phoneNumber: "3000000020",
      city: "Bogotá",
      department: "Cundinamarca",
      neighborhood: "Chapinero",
      latitude: 4.65,
      longitude: -74.06,
      teamSize: 0,
      createdAt: new Date("2024-02-15"),
    },
  ],
  // Multiplicadores bajo LINK (Carlos Rodríguez)
  linkMultipliers: [
    {
      id: "multiplier-1",
      name: "Ana Martínez",
      phoneNumber: "3000000005",
      email: "ana@campana.com",
      photo: undefined,
      teamSize: 15,
    },
    {
      id: "multiplier-2",
      name: "Luis García",
      phoneNumber: "3000000021",
      email: "luis@campana.com",
      photo: undefined,
      teamSize: 8,
    },
    {
      id: "multiplier-3",
      name: "María López",
      phoneNumber: "3000000022",
      email: "maria.lopez@campana.com",
      photo: undefined,
      teamSize: 12,
    },
  ],
};

// Líder del MULTIPLIER (Ana Martínez) - sería el LINK (Carlos Rodríguez)
export const MOCK_LEADER = {
  id: "user-link-1",
  name: "Carlos Rodríguez",
  phoneNumber: "3000000004",
  email: "carlos@campana.com",
  photo: undefined,
  teamSize: 3, // Tiene 3 multiplicadores bajo su gestión
};

// Actividades mock
export const MOCK_ACTIVITIES = [
  {
    id: "act-1",
    userId: "member-1",
    userName: "Juan Pérez",
    action: "Registro completado",
    city: "Bogotá",
    department: "Cundinamarca",
    createdAt: new Date("2024-01-10T10:30:00"),
  },
  {
    id: "act-2",
    userId: "member-2",
    userName: "Laura Sánchez",
    action: "Registro completado",
    city: "Bogotá",
    department: "Cundinamarca",
    createdAt: new Date("2024-01-12T14:15:00"),
  },
  {
    id: "act-3",
    userId: "member-3",
    userName: "Roberto Gómez",
    action: "Registro completado",
    city: "Bogotá",
    department: "Cundinamarca",
    createdAt: new Date("2024-01-15T09:45:00"),
  },
  {
    id: "act-4",
    userId: "member-4",
    userName: "Carmen López",
    action: "Registro completado",
    city: "Bogotá",
    department: "Cundinamarca",
    createdAt: new Date("2024-01-18T16:20:00"),
  },
  {
    id: "act-5",
    userId: "member-5",
    userName: "Diego Ramírez",
    action: "Registro completado",
    city: "Bogotá",
    department: "Cundinamarca",
    createdAt: new Date("2024-01-20T11:10:00"),
  },
];

// Alertas de fraude mock (para COORDINATOR)
export const MOCK_FRAUD_ALERTS = [
  {
    id: "alert-1",
    type: "duplicate_document",
    userId: "user-suspicious-1",
    userName: "Usuario Sospechoso",
    documentNumber: "1234567890",
    description: "Documento duplicado detectado",
    severity: "high",
    status: "pending",
    createdAt: new Date("2024-02-01T10:00:00"),
  },
  {
    id: "alert-2",
    type: "duplicate_phone",
    userId: "user-suspicious-2",
    userName: "Otro Usuario",
    phoneNumber: "3000000001",
    description: "Número de teléfono duplicado",
    severity: "medium",
    status: "pending",
    createdAt: new Date("2024-02-02T14:30:00"),
  },
];

// Solicitudes de divorcio mock (para COORDINATOR)
export const MOCK_DIVORCE_REQUESTS = [
  {
    id: "divorce-1",
    userId: "member-5",
    userName: "Diego Ramírez",
    currentLeaderId: "user-multiplier-1",
    currentLeaderName: "Ana Martínez",
    requestedLeaderId: "multiplier-2",
    requestedLeaderName: "Luis García",
    reason: "Cambio de zona de residencia",
    status: "pending",
    createdAt: new Date("2024-02-10T09:00:00"),
  },
  {
    id: "divorce-2",
    userId: "member-8",
    userName: "Patricia Vargas",
    currentLeaderId: "user-multiplier-1",
    currentLeaderName: "Ana Martínez",
    requestedLeaderId: "multiplier-3",
    requestedLeaderName: "María López",
    reason: "Mejor relación con otro multiplicador",
    status: "pending",
    createdAt: new Date("2024-02-12T11:30:00"),
  },
];

// Helper para obtener usuario por teléfono
export function getUserByPhone(phoneNumber: string) {
  return Object.values(MOCK_USERS).find(
    (user) => user.phoneNumber === phoneNumber
  );
}

// Helper para obtener OTP por teléfono
export function getOtpByPhone(phoneNumber: string): string | null {
  const entry = Object.entries(MOCK_CREDENTIALS).find(
    ([_, creds]) => creds.phoneNumber === phoneNumber
  );
  return entry ? entry[1].otp : null;
}

// Solicitudes de multiplicador mock - Array vacío inicialmente, se llenará con solicitudes creadas por usuarios
export const MOCK_MULTIPLIER_REQUESTS: Array<{
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  campaignId: string;
  campaignName?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewerName?: string;
  rejectionReason?: string;
}> = [];

// Helper para generar QR data
export function generateQRData(userId: string, campaignId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/register?leaderId=${userId}&leaderName=${encodeURIComponent(
    MOCK_USERS.MULTIPLIER.name
  )}&campaignId=${campaignId}`;
}
