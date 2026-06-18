export type MobileUser = {
  email: string;
  id: string;
  name: string;
  permissions: string[];
  role: string;
};

export type MobileSession = {
  expiresAt: Date;
  token: string;
  user: MobileUser;
};

export interface AuthRepository {
  login(email: string, password: string): Promise<MobileSession>;
  logout(): Promise<void>;
}
