import { UserRole } from "@paobom/domain";

export type UserDTO = {
  active: boolean;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
  updatedAt: string;
};

export type CreateUserDTO = {
  email: string;
  name: string;
  password: string;
  role: UserRole;
};

export type UpdateUserDTO = {
  active?: boolean;
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
};
