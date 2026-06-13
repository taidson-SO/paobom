export type CustomerProps = {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  notes: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCustomerInput = {
  name: string;
  document: string;
  phone: string;
  email: string;
  notes: string;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export class Customer {
  constructor(private props: CustomerProps) {
    this.assertValid();
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get document() {
    return this.props.document;
  }

  get phone() {
    return this.props.phone;
  }

  get email() {
    return this.props.email;
  }

  get notes() {
    return this.props.notes;
  }

  get active() {
    return this.props.active;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdateCustomerInput) {
    this.props = {
      ...this.props,
      ...input,
      updatedAt: new Date(),
    };

    this.assertValid();
  }

  deactivate() {
    this.props = {
      ...this.props,
      active: false,
      updatedAt: new Date(),
    };
  }

  toJSON(): CustomerProps {
    return { ...this.props };
  }

  private assertValid() {
    if (this.props.name.trim().length < 2) {
      throw new Error("Nome do cliente deve ter pelo menos 2 caracteres");
    }
  }
}

export interface CustomerRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  deactivate(id: string): Promise<Customer>;
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer>;
}

export class ListCustomersUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  execute(input: CreateCustomerInput) {
    return this.repository.create(input);
  }
}

export class UpdateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  execute(id: string, input: UpdateCustomerInput) {
    if (!id) {
      throw new Error("Cliente nao informado");
    }

    return this.repository.update(id, input);
  }
}

export class DeactivateCustomerUseCase {
  constructor(private readonly repository: CustomerRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Cliente nao informado");
    }

    return this.repository.deactivate(id);
  }
}
