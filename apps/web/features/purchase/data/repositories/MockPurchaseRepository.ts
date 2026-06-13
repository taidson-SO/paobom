import {
  CreatePurchaseInput,
  Purchase,
  PurchaseRepository,
} from "@paobom/domain";

import { PurchaseDTO } from "@/features/purchase/data/dto/PurchaseDTO";
import { PurchaseMapper } from "@/features/purchase/data/mappers/PurchaseMapper";

const now = new Date().toISOString();

let purchases: PurchaseDTO[] = [
  {
    created_at: now,
    expected_date: now,
    id: "pur-1",
    items: [
      {
        id: "pur-item-1",
        product_id: "prod-1",
        quantity: 10,
        unit_cost: 92,
      },
    ],
    notes: "Reposicao semanal de farinha",
    received_at: null,
    status: "ordered",
    supplier_id: "sup-1",
    updated_at: now,
  },
];

export class MockPurchaseRepository implements PurchaseRepository {
  async cancel(id: string) {
    const purchase = await this.requireById(id);

    purchase.cancel();
    purchases = purchases.map((item) =>
      item.id === id ? PurchaseMapper.toDTO(purchase) : item,
    );

    return purchase;
  }

  async create(input: CreatePurchaseInput) {
    const purchase = new Purchase({
      ...input,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      items: input.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      })),
      status: "ordered",
      updatedAt: new Date(),
      receivedAt: null,
    });

    purchases = [PurchaseMapper.toDTO(purchase), ...purchases];

    return purchase;
  }

  async findAll() {
    return purchases.map(PurchaseMapper.toEntity);
  }

  async findById(id: string) {
    const purchase = purchases.find((item) => item.id === id);

    return purchase ? PurchaseMapper.toEntity(purchase) : null;
  }

  async receive(id: string) {
    const purchase = await this.requireById(id);

    purchase.receive();
    purchases = purchases.map((item) =>
      item.id === id ? PurchaseMapper.toDTO(purchase) : item,
    );

    return purchase;
  }

  private async requireById(id: string) {
    const purchase = await this.findById(id);

    if (!purchase) {
      throw new Error("Compra nao encontrada");
    }

    return purchase;
  }
}
