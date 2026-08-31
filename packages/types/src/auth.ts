export type UserRole = 'USER' | 'SECURITY_USER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type DeviceType = 'ANDROID' | 'IOS' | 'WEB' | 'DESKTOP';

export interface UserProfile {
  id: string;
  phone?: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInfo {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  publicKey: string;
  fcmToken?: string;
  isRevoked: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  phone?: string;
  email?: string;
  username: string;
  password: string;
  displayName: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  identityKeyPublic: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
}

export interface LoginRequest {
  identifier: string; // username, email or phone
  password: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
}

export interface AuthResponse {
  user: UserProfile;
  device: DeviceInfo;
  tokens: AuthTokens;
}
