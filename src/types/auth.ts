// ─── Auth Types ───────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

export interface SignUpMetadata {
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  referralCode?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata?: SignUpMetadata) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  isEmailVerified: () => boolean;
  getUserProfile: () => Promise<UserProfile | null>;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  level: number;
  wallet_balance: number;
  reputation: number;
  total_orders: number;
  is_active: boolean;
  is_frozen: boolean;
  referral_code: string | null;
  created_at: string;
}
