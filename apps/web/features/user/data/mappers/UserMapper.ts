import { UserRole } from "@paobom/domain";

import { UserDTO } from "@/features/user/data/dto/UserDTO";

export type ManagedUser = {
  active: boolean;
  createdAt: Date;
  email: string;
  id: string;
  name: string;
  role: UserRole;
  updatedAt: Date;
};

export class UserMapper {
  static toModel(dto: UserDTO): ManagedUser {
    return {
      active: dto.active,
      createdAt: new Date(dto.createdAt),
      email: dto.email,
      id: dto.id,
      name: dto.name,
      role: dto.role,
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
