import { Sale, SaleRepository } from "@paobom/domain";

import { SaleDTO } from "@/features/sales/data/dto/SalesDTO";
import { SalesMapper } from "@/features/sales/data/mappers/SalesMapper";

const now = new Date().toISOString();

let sales: SaleDTO[] = [
  {
    created_at: now,
    customer_id: "cus-1",
    discount_amount: 0,
    discount_authorized_by: null,
    discount_reason: null,
    id: "sale-1",
    items: [
      {
        id: "sale-item-1",
        product_id: "prod-2",
        quantity: 20,
        unit_cost: 0.22,
        unit_price: 0.75,
      },
    ],
    notes: "Venda inicial de paes",
    oversell_approved_by: null,
    oversell_justification: null,
    paid_at: now,
    payment_method: "pix",
    status: "paid",
    updated_at: now,
  },
];

export class MockSaleRepository implements SaleRepository {
  async cancel(id: string) {
    const sale = await this.getById(id);

    sale.cancel();
    sales = sales.map((item) =>
      item.id === id ? SalesMapper.toDTO(sale) : item,
    );

    return sale;
  }

  async create(sale: Sale) {
    sales = [SalesMapper.toDTO(sale), ...sales];

    return sale;
  }

  async findAll() {
    return sales
      .map(SalesMapper.toEntity)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string) {
    const sale = sales.find((item) => item.id === id);

    return sale ? SalesMapper.toEntity(sale) : null;
  }

  async pay(id: string) {
    const sale = await this.getById(id);

    sale.pay();
    sales = sales.map((item) =>
      item.id === id ? SalesMapper.toDTO(sale) : item,
    );

    return sale;
  }

  private async getById(id: string) {
    const sale = await this.findById(id);

    if (!sale) {
      throw new Error("Venda nao encontrada");
    }

    return sale;
  }
}
