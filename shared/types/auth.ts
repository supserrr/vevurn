// Authentication types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

// Alias for compatibility
export type CreateUserRequest = RegisterRequest;

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
