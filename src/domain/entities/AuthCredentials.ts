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
