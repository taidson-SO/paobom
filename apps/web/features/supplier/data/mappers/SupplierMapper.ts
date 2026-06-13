import { Supplier, SupplierProps } from "@paobom/domain";

import { SupplierDTO } from "@/features/supplier/data/dto/SupplierDTO";

export class SupplierMapper {
  static toDTO(entity: Supplier): SupplierDTO {
    const supplier = entity.toJSON();

    return {
      active: supplier.active,
      contact_name: supplier.contactName,
      created_at: supplier.createdAt.toISOString(),
      document: supplier.document,
      email: supplier.email,
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      updated_at: supplier.updatedAt.toISOString(),
    };
  }

  static toEntity(dto: SupplierDTO) {
    const props: SupplierProps = {
      active: dto.active,
      contactName: dto.contact_name,
      createdAt: new Date(dto.created_at),
      document: dto.document,
      email: dto.email,
      id: dto.id,
      name: dto.name,
      phone: dto.phone,
      updatedAt: new Date(dto.updated_at),
    };

    return new Supplier(props);
  }
}
