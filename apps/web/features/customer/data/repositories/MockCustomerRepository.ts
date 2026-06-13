import {
  CreateCustomerInput,
  Customer,
  CustomerRepository,
  UpdateCustomerInput,
} from "@paobom/domain";

import { CustomerDTO } from "@/features/customer/data/dto/CustomerDTO";
import { CustomerMapper } from "@/features/customer/data/mappers/CustomerMapper";

const now = new Date().toISOString();

let customers: CustomerDTO[] = [
  {
    active: true,
    created_at: now,
    document: "123.456.789-00",
    email: "ana@example.com",
    id: "cus-1",
    name: "Ana Ferreira",
    notes: "Cliente recorrente de encomendas",
    phone: "(81) 98888-1111",
    updated_at: now,
  },
  {
    active: true,
    created_at: now,
    document: "987.654.321-00",
    email: "mercadinho@example.com",
    id: "cus-2",
    name: "Mercadinho Sao Jose",
    notes: "Compra paes para revenda",
    phone: "(81) 98888-2222",
    updated_at: now,
  },
];

export class MockCustomerRepository implements CustomerRepository {
  async create(input: CreateCustomerInput) {
    const customer = new Customer({
      ...input,
      active: true,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      updatedAt: new Date(),
    });

    customers = [CustomerMapper.toDTO(customer), ...customers];

    return customer;
  }

  async deactivate(id: string) {
    const customer = await this.findById(id);

    customer.deactivate();
    customers = customers.map((item) =>
      item.id === id ? CustomerMapper.toDTO(customer) : item,
    );

    return customer;
  }

  async findAll() {
    return customers.map(CustomerMapper.toEntity);
  }

  async update(id: string, input: UpdateCustomerInput) {
    const customer = await this.findById(id);

    customer.update(input);
    customers = customers.map((item) =>
      item.id === id ? CustomerMapper.toDTO(customer) : item,
    );

    return customer;
  }

  private async findById(id: string) {
    const customer = customers.find((item) => item.id === id);

    if (!customer) {
      throw new Error("Cliente nao encontrado");
    }

    return CustomerMapper.toEntity(customer);
  }
}
