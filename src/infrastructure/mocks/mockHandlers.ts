// Mock Handlers - Simulan respuestas de API

import {
  MOCK_USERS,
  MOCK_CAMPAIGNS,
  MOCK_TEAM_MEMBERS,
  MOCK_LEADER,
  MOCK_ACTIVITIES,
  MOCK_FRAUD_ALERTS,
  MOCK_DIVORCE_REQUESTS,
  MOCK_MULTIPLIER_REQUESTS,
  getUserByPhone,
  getOtpByPhone,
  generateQRData,
} from "./mockData";

// Simular delay de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper para extraer token de headers
function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Almacenar mapeo de token a usuario (simulación de sesión)
const tokenToUserMap = new Map<string, any>();

// Helper para obtener usuario actual desde token
function getCurrentUserFromToken(token: string | null) {
  if (!token) return null;

  // Primero intentar buscar en el mapa de tokens (para sesiones activas)
  if (tokenToUserMap.has(token)) {
    return tokenToUserMap.get(token);
  }

  // Si no está en el mapa, extraer el userId del token y buscar en MOCK_USERS
  // Formato del token: mock-token-{userId}-{timestamp}
  const match = token.match(/mock-token-(.+?)-/);
  if (match) {
    const userId = match[1];
    console.log(
      "[Mock] getCurrentUserFromToken: Buscando usuario con ID:",
      userId
    );

    // Buscar usuario por ID en los mocks
    const user = Object.values(MOCK_USERS).find((u: any) => u.id === userId);
    if (user) {
      // Guardar en el mapa para futuras referencias
      tokenToUserMap.set(token, user);
      console.log(
        "[Mock] getCurrentUserFromToken: Usuario encontrado:",
        user.name
      );
      return user;
    } else {
      console.error(
        "[Mock] getCurrentUserFromToken: Usuario no encontrado con ID:",
        userId
      );
    }
  } else {
    console.error(
      "[Mock] getCurrentUserFromToken: Formato de token inválido:",
      token.substring(0, 30)
    );
  }

  // No retornar fallback - si no encontramos el usuario, retornar null
  // Esto forzará un error de autenticación apropiado
  return null;
}

// Auth Handlers
export const authHandlers = {
  async sendOtp(phoneNumber: string) {
    await delay(200);
    const user = getUserByPhone(phoneNumber);
    const otp = getOtpByPhone(phoneNumber);

    if (!user || !otp) {
      throw new Error("Número de teléfono no encontrado");
    }

    return {
      success: true,
      message: "Código OTP enviado exitosamente",
      otpCode: otp, // Solo en desarrollo
    };
  },

  async verifyOtp(phoneNumber: string, otpCode: string) {
    await delay(300);
    const user = getUserByPhone(phoneNumber);
    const expectedOtp = getOtpByPhone(phoneNumber);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (otpCode !== expectedOtp) {
      throw new Error("Código OTP inválido");
    }

    // Generar token mock (en producción sería JWT)
    const token = `mock-token-${user.id}-${Date.now()}`;

    // Almacenar mapeo token -> usuario
    tokenToUserMap.set(token, user);

    console.log("[Mock] verifyOtp: Token generado:", token);
    console.log("[Mock] verifyOtp: Usuario:", user.name, "Rol:", user.role);
    console.log("[Mock] verifyOtp: Token guardado en mapa");

    return {
      user: {
        ...user,
        role: user.role,
      },
      tokens: {
        accessToken: token,
        refreshToken: `mock-refresh-${user.id}`,
      },
    };
  },

  async register(credentials: any) {
    await delay(400);

    // Verificar si el usuario ya existe (por teléfono)
    let existingUser = Object.values(MOCK_USERS).find(
      (u: any) => u.phoneNumber === credentials.phoneNumber
    ) as any;

    let campaignIds: string[] = [];
    if (existingUser) {
      // Si el usuario existe, obtener sus campaignIds existentes
      campaignIds = existingUser.campaignIds || [];
      // Si existe campaignId (legacy), agregarlo también
      if (
        existingUser.campaignId &&
        !campaignIds.includes(existingUser.campaignId)
      ) {
        campaignIds.push(existingUser.campaignId);
      }
    }

    // Verificar si es una nueva campaña para este usuario
    const isNewCampaign =
      credentials.campaignId && !campaignIds.includes(credentials.campaignId);

    // Si hay una nueva campaña, agregarla a la lista
    if (isNewCampaign && credentials.campaignId) {
      campaignIds.push(credentials.campaignId);

      // Incrementar el contador de participants de la campaña
      const campaign = MOCK_CAMPAIGNS.find(
        (c) => c.id === credentials.campaignId
      );
      if (campaign) {
        campaign.participants = (campaign.participants || 0) + 1;
        console.log(
          `[Mock] ✅ Contador de participants incrementado para campaña ${credentials.campaignId}. Nuevo total: ${campaign.participants}`
        );
      } else {
        console.warn(
          `[Mock] ⚠️ Campaña ${credentials.campaignId} no encontrada en MOCK_CAMPAIGNS`
        );
      }
    }

    // Incrementar el contador de participants del multiplicador (líder) si existe
    if (credentials.leaderId) {
      const leader = Object.values(MOCK_USERS).find(
        (u: any) => u.id === credentials.leaderId
      ) as any;
      if (leader) {
        leader.participants = (leader.participants || 0) + 1;
        console.log(
          `[Mock] ✅ Contador de participants incrementado para multiplicador ${credentials.leaderId}. Nuevo total: ${leader.participants}`
        );
      } else {
        console.warn(
          `[Mock] ⚠️ Multiplicador ${credentials.leaderId} no encontrado en MOCK_USERS`
        );
      }
    }

    // Crear o actualizar usuario MULTIPLIER
    const newUser = {
      id: existingUser?.id || `user-${Date.now()}`,
      name: `${credentials.firstName} ${credentials.lastName}`,
      phoneNumber: credentials.phoneNumber,
      email: existingUser?.email || undefined,
      role: credentials.campaignId
        ? ("MULTIPLIER" as const)
        : ("ADMIN" as const),
      documentNumber: credentials.documentNumber,
      country: credentials.country,
      department: credentials.department,
      city: credentials.city,
      neighborhood: credentials.neighborhood,
      latitude: credentials.latitude,
      longitude: credentials.longitude,
      leaderId: credentials.leaderId,
      leaderName: credentials.leaderName,
      campaignIds: campaignIds,
      createdAt: existingUser?.createdAt || new Date(),
    };

    const token = `mock-token-${newUser.id}-${Date.now()}`;

    // Almacenar mapeo token -> usuario
    tokenToUserMap.set(token, newUser);

    return {
      user: newUser,
      tokens: {
        accessToken: token,
        refreshToken: `mock-refresh-${newUser.id}`,
      },
    };
  },

  async logout() {
    await delay(100);
    return { success: true };
  },

  async getCurrentUser(token: string | null) {
    await delay(150);
    if (!token) {
      console.error("[Mock] getCurrentUser: No token provided");
      throw new Error("No autorizado");
    }

    console.log(
      "[Mock] getCurrentUser: Token recibido:",
      token.substring(0, 20) + "..."
    );
    console.log(
      "[Mock] getCurrentUser: Tokens en mapa:",
      Array.from(tokenToUserMap.keys()).map((k) => k.substring(0, 20) + "...")
    );

    // En mock, retornamos el usuario según el token
    // En producción, decodificaríamos el JWT
    const user = getCurrentUserFromToken(token);
    if (!user) {
      console.error(
        "[Mock] getCurrentUser: Usuario no encontrado para token:",
        token.substring(0, 20) + "..."
      );
      throw new Error("Usuario no encontrado");
    }

    console.log(
      "[Mock] getCurrentUser: Usuario encontrado:",
      user.name,
      "Rol:",
      user.role
    );

    // Retornar usuario con formato correcto (convertir Date a string si es necesario)
    return {
      ...user,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt,
    };
  },
};

// Dashboard Handlers
export const dashboardHandlers = {
  async getCampaigns(token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Todos los usuarios pueden ver campañas
    return MOCK_CAMPAIGNS.map((campaign) => ({
      ...campaign,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
    }));
  },

  async createCampaign(data: any, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo ADMIN y SUPER_ADMIN pueden crear campañas
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("No tienes permisos para crear campañas");
    }

    // Validaciones
    if (!data.name || !data.description || !data.startDate || !data.endDate) {
      throw new Error("Todos los campos son requeridos");
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error(
        "La fecha de fin debe ser posterior a la fecha de inicio"
      );
    }

    // Crear nueva campaña
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name: data.name.trim(),
      description: data.description.trim(),
      startDate: startDate,
      endDate: endDate,
      status: data.status || "active",
      participants: 0,
      createdAt: new Date(),
    };

    // Agregar a la lista de campañas mock
    MOCK_CAMPAIGNS.push(newCampaign);

    return {
      ...newCampaign,
      startDate: newCampaign.startDate.toISOString(),
      endDate: newCampaign.endDate.toISOString(),
      createdAt: newCampaign.createdAt.toISOString(),
    };
  },

  async getCampaignDetail(campaignId: string, token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo ADMIN y SUPER_ADMIN pueden ver detalles completos
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("No tienes permisos para ver los detalles de la campaña");
    }

    // Buscar la campaña
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId);
    if (!campaign) {
      throw new Error("Campaña no encontrada");
    }

    // Retornar detalles completos con métricas adicionales
    return {
      ...campaign,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      totalMultipliers: 45, // Mock data
      totalFollowers: 1205, // Mock data
      totalCoordinators: 3, // Mock data
      totalLinks: 8, // Mock data
      activeZones: 12, // Mock data
      growthRate: 15.5, // Mock data
      budget: {
        allocated: 50000000,
        spent: 12500000,
        remaining: 37500000,
      },
      metrics: {
        registrationsToday: 23,
        registrationsThisWeek: 156,
        registrationsThisMonth: 642,
      },
    };
  },

  async getMyTeam(
    campaignId: string,
    token: string | null,
    options?: {
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ) {
    await delay(250);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    let teamData: any[] = [];

    // MULTIPLIER ve su equipo (seguidores)
    if (user.role === "MULTIPLIER") {
      teamData = MOCK_TEAM_MEMBERS.multiplierTeam.map((member) => ({
        ...member,
        createdAt: member.createdAt.toISOString(),
      }));
    } else if (user.role === "LINK") {
      // LINK ve multiplicadores bajo su gestión
      teamData = MOCK_TEAM_MEMBERS.linkMultipliers;
    } else if (user.role === "FOLLOWER") {
      // FOLLOWER no tiene equipo
      return [];
    } else {
      // COORDINATOR y ADMIN ven estructura completa según su nivel
      return [];
    }

    // Aplicar ordenamiento
    if (options?.sortBy) {
      const sortField = options.sortBy as keyof (typeof teamData)[0];
      const sortOrder = options.sortOrder || "asc";

      teamData.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Manejar fechas
        if (sortField === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Manejar números
        if (sortField === "teamSize") {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }

        // Manejar strings (incluyendo phoneNumber)
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Manejar valores null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortOrder === "asc" ? 1 : -1;
        if (bValue == null) return sortOrder === "asc" ? -1 : 1;

        // Comparar
        if (aValue < bValue) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // Aplicar límite
    if (options?.limit) {
      teamData = teamData.slice(0, options.limit);
    }

    return teamData;
  },

  async addTeamMember(data: any, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo MULTIPLIER puede agregar miembros directamente
    if (user.role !== "MULTIPLIER") {
      throw new Error("No tienes permisos para agregar miembros");
    }

    return {
      success: true,
      message: "Miembro agregado exitosamente",
    };
  },

  async getMyLeader(campaignId: string, token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // MULTIPLIER ve su LINK
    if (user.role === "MULTIPLIER") {
      return MOCK_LEADER;
    }

    // FOLLOWER ve su MULTIPLIER
    if (user.role === "FOLLOWER") {
      return {
        id: MOCK_USERS.MULTIPLIER.id,
        name: MOCK_USERS.MULTIPLIER.name,
        phoneNumber: MOCK_USERS.MULTIPLIER.phoneNumber,
        email: MOCK_USERS.MULTIPLIER.email,
        photo: undefined,
        teamSize: MOCK_TEAM_MEMBERS.multiplierTeam.length,
      };
    }

    // Otros roles no tienen líder
    return null;
  },

  async getQRCode(campaignId: string, token: string | null) {
    await delay(150);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo MULTIPLIER tiene QR code
    if (user.role !== "MULTIPLIER") {
      throw new Error("Solo los multiplicadores tienen código QR");
    }

    const qrData = generateQRData(user.id, campaignId);

    return {
      qrData,
      userId: user.id,
      campaignId,
    };
  },

  async getActivities(campaignId: string, token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return MOCK_ACTIVITIES.map((activity) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
    }));
  },

  async getCampaignProposal(campaignId: string, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Simular PDF mock (en producción sería un blob real)
    const mockPdfContent = `Mock PDF Content for Campaign ${campaignId}`;
    return new Blob([mockPdfContent], { type: "application/pdf" });
  },

  // Handlers específicos para COORDINATOR
  async getFraudAlerts(token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user || user.role !== "COORDINATOR") {
      throw new Error("Solo los coordinadores pueden ver alertas de fraude");
    }

    return MOCK_FRAUD_ALERTS.map((alert) => ({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
    }));
  },

  async getDivorceRequests(token: string | null) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user || user.role !== "COORDINATOR") {
      throw new Error(
        "Solo los coordinadores pueden ver solicitudes de divorcio"
      );
    }

    return MOCK_DIVORCE_REQUESTS.map((request) => ({
      ...request,
      createdAt: request.createdAt.toISOString(),
    }));
  },

  async approveDivorce(divorceId: string, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user || user.role !== "COORDINATOR") {
      throw new Error("Solo los coordinadores pueden aprobar divorcios");
    }

    return {
      success: true,
      message: "Divorcio aprobado exitosamente",
    };
  },

  // Multiplier Request Handlers
  async createMultiplierRequest(data: any, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo FOLLOWER puede solicitar ser multiplicador
    if (user.role !== "FOLLOWER") {
      throw new Error("Solo los seguidores pueden solicitar ser multiplicador");
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = MOCK_MULTIPLIER_REQUESTS.find(
      (req) =>
        req.userId === user.id &&
        req.campaignId === data.campaignId &&
        req.status === "pending"
    );

    if (existingRequest) {
      throw new Error("Ya tienes una solicitud pendiente de multiplicador");
    }

    // Crear nueva solicitud
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === data.campaignId);
    const newRequest = {
      id: `multiplier-request-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userPhoneNumber: user.phoneNumber || "",
      campaignId: data.campaignId,
      campaignName: campaign?.name || undefined,
      status: "pending" as const,
      requestedAt: new Date(),
    };

    MOCK_MULTIPLIER_REQUESTS.push(newRequest);

    return {
      ...newRequest,
      requestedAt: newRequest.requestedAt.toISOString(),
    };
  },

  async getMultiplierRequestByUser(
    userId: string,
    campaignId: string,
    token: string | null
  ) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo el mismo usuario puede ver su solicitud
    if (user.id !== userId) {
      throw new Error("No tienes permisos para ver esta solicitud");
    }

    const request = MOCK_MULTIPLIER_REQUESTS.find(
      (req) => req.userId === userId && req.campaignId === campaignId
    );

    if (!request) {
      return null;
    }

    return {
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
    };
  },

  async getMultiplierRequests(
    campaignId: string,
    reviewerId: string | undefined,
    token: string | null
  ) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo ADMIN puede ver solicitudes de multiplicador
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error(
        "Solo los administradores pueden ver solicitudes de multiplicador"
      );
    }

    // Filtrar solicitudes por campaña y estado pendiente
    const requests = MOCK_MULTIPLIER_REQUESTS.filter(
      (req) => req.campaignId === campaignId && req.status === "pending"
    );

    return requests.map((request) => ({
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
    }));
  },

  async getMultiplierRequestById(id: string, token: string | null) {
    await delay(150);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const request = MOCK_MULTIPLIER_REQUESTS.find((req) => req.id === id);

    if (!request) {
      return null;
    }

    return {
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
    };
  },

  async approveMultiplierRequest(requestId: string, token: string | null) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo ADMIN puede aprobar solicitudes
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error(
        "Solo los administradores pueden aprobar solicitudes de multiplicador"
      );
    }

    const request = MOCK_MULTIPLIER_REQUESTS.find(
      (req) => req.id === requestId
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "pending") {
      throw new Error(
        `La solicitud ya fue ${
          request.status === "approved" ? "aprobada" : "rechazada"
        }`
      );
    }

    // Actualizar solicitud
    request.status = "approved";
    request.reviewedAt = new Date();
    request.reviewedBy = user.id;
    request.reviewerName = user.name;

    return {
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt.toISOString(),
    };
  },

  async rejectMultiplierRequest(
    requestId: string,
    rejectionReason: string | undefined,
    token: string | null
  ) {
    await delay(300);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Solo ADMIN puede rechazar solicitudes
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error(
        "Solo los administradores pueden rechazar solicitudes de multiplicador"
      );
    }

    const request = MOCK_MULTIPLIER_REQUESTS.find(
      (req) => req.id === requestId
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "pending") {
      throw new Error(
        `La solicitud ya fue ${
          request.status === "approved" ? "aprobada" : "rechazada"
        }`
      );
    }

    // Actualizar solicitud
    request.status = "rejected";
    request.reviewedAt = new Date();
    request.reviewedBy = user.id;
    request.reviewerName = user.name;
    request.rejectionReason = rejectionReason;

    return {
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt.toISOString(),
    };
  },

  async updateMultiplierRequest(
    requestId: string,
    updates: any,
    token: string | null
  ) {
    await delay(200);
    if (!token) {
      throw new Error("No autorizado");
    }

    const user = getCurrentUserFromToken(token);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const request = MOCK_MULTIPLIER_REQUESTS.find(
      (req) => req.id === requestId
    );

    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    // Actualizar campos permitidos
    Object.assign(request, updates);

    return {
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString(),
    };
  },
};
