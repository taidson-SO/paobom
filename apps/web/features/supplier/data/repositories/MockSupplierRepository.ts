import {
  CreateSupplierInput,
  Supplier,
  SupplierRepository,
  UpdateSupplierInput,
} from "@paobom/domain";

import { SupplierDTO } from "@/features/supplier/data/dto/SupplierDTO";
import { SupplierMapper } from "@/features/supplier/data/mappers/SupplierMapper";

const now = new Date().toISOString();

let suppliers: SupplierDTO[] = [
  {
    active: true,
    contact_name: "Marina Alves",
    created_at: now,
    document: "12.345.678/0001-90",
    email: "compras@moinhosertao.com",
    id: "sup-1",
    name: "Moinho Sertao",
    phone: "(81) 3000-1000",
    updated_at: now,
  },
  {
    active: true,
    contact_name: "Carlos Lima",
    created_at: now,
    document: "98.765.432/0001-10",
    email: "atendimento@laticiniosbomleite.com",
    id: "sup-2",
    name: "Laticinios Bom Leite",
    phone: "(81) 3000-2000",
    updated_at: now,
  },
];

export class MockSupplierRepository implements SupplierRepository {
  async create(input: CreateSupplierInput) {
    const supplier = new Supplier({
      ...input,
      active: true,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      updatedAt: new Date(),
    });

    suppliers = [SupplierMapper.toDTO(supplier), ...suppliers];

    return supplier;
  }

  async deactivate(id: string) {
    const supplier = await this.requireById(id);

    supplier.deactivate();
    suppliers = suppliers.map((item) =>
      item.id === id ? SupplierMapper.toDTO(supplier) : item,
    );

    return supplier;
  }

  async findAll() {
    return suppliers.map(SupplierMapper.toEntity);
  }

  async findById(id: string) {
    const supplier = suppliers.find((item) => item.id === id);

    return supplier ? SupplierMapper.toEntity(supplier) : null;
  }

  async update(id: string, input: UpdateSupplierInput) {
    const supplier = await this.requireById(id);

    supplier.update(input);
    suppliers = suppliers.map((item) =>
      item.id === id ? SupplierMapper.toDTO(supplier) : item,
    );

    return supplier;
  }

  private async requireById(id: string) {
    const supplier = await this.findById(id);

    if (!supplier) {
      throw new Error("Fornecedor nao encontrado");
    }

    return supplier;
  }
}
