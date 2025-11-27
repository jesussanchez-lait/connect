export interface LoginCredentials {
  phoneNumber: string;
}

export interface OtpVerification {
  phoneNumber: string;
  otpCode: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpCode?: string; // Solo en desarrollo
}

export interface RegisterCredentials {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  city: string;
  neighborhood: string;
  leaderId: string;
  leaderName: string;
}
