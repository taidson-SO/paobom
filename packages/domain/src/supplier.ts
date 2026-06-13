export type SupplierProps = {
  id: string;
  name: string;
  document: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSupplierInput = {
  name: string;
  document: string;
  contactName: string;
  phone: string;
  email: string;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export class Supplier {
  constructor(private props: SupplierProps) {
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

  get contactName() {
    return this.props.contactName;
  }

  get phone() {
    return this.props.phone;
  }

  get email() {
    return this.props.email;
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

  update(input: UpdateSupplierInput) {
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

  toJSON(): SupplierProps {
    return { ...this.props };
  }

  private assertValid() {
    if (this.props.name.trim().length < 2) {
      throw new Error("Nome do fornecedor deve ter pelo menos 2 caracteres");
    }

    if (this.props.document.trim().length < 3) {
      throw new Error("Documento do fornecedor deve ser informado");
    }
  }
}

export interface SupplierRepository {
  create(input: CreateSupplierInput): Promise<Supplier>;
  deactivate(id: string): Promise<Supplier>;
  findAll(): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  update(id: string, input: UpdateSupplierInput): Promise<Supplier>;
}

export class ListSuppliersUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  execute() {
    return this.repository.findAll();
  }
}

export class CreateSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  execute(input: CreateSupplierInput) {
    return this.repository.create(input);
  }
}

export class UpdateSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  execute(id: string, input: UpdateSupplierInput) {
    if (!id) {
      throw new Error("Fornecedor nao informado");
    }

    return this.repository.update(id, input);
  }
}

export class DeactivateSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  execute(id: string) {
    if (!id) {
      throw new Error("Fornecedor nao informado");
    }

    return this.repository.deactivate(id);
  }
}
