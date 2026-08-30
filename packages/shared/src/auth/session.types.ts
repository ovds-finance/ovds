export interface SessionDto {
  id: string;
  ipAddress: string;
  country: string;
  countryCode?: string;
  userAgent: string;
  deviceType?: string;
  lastActive: string | Date;
  lastSeenAt?: string | Date;
  location?: string;
  expiresAt: string | Date;
}

export interface UserSessions {
  userId: string;
  username: string;
  sessionsCount: number;
  sessions: SessionDto[];
}
