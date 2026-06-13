import { Customer, CustomerProps } from "@paobom/domain";

import { CustomerDTO } from "@/features/customer/data/dto/CustomerDTO";

export class CustomerMapper {
  static toDTO(entity: Customer): CustomerDTO {
    const customer = entity.toJSON();

    return {
      active: customer.active,
      created_at: customer.createdAt.toISOString(),
      document: customer.document,
      email: customer.email,
      id: customer.id,
      name: customer.name,
      notes: customer.notes,
      phone: customer.phone,
      updated_at: customer.updatedAt.toISOString(),
    };
  }

  static toEntity(dto: CustomerDTO) {
    const props: CustomerProps = {
      active: dto.active,
      createdAt: new Date(dto.created_at),
      document: dto.document,
      email: dto.email,
      id: dto.id,
      name: dto.name,
      notes: dto.notes,
      phone: dto.phone,
      updatedAt: new Date(dto.updated_at),
    };

    return new Customer(props);
  }
}
