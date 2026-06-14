import {
  ProductionOrder,
  ProductionOrderRepository,
} from "@paobom/domain";

import { ProductionOrderDTO } from "@/features/production/data/dto/ProductionDTO";
import { ProductionMapper } from "@/features/production/data/mappers/ProductionMapper";

let orders: ProductionOrderDTO[] = [];

export class MockProductionOrderRepository implements ProductionOrderRepository {
  async cancel(id: string) {
    const order = await this.requireById(id);

    order.cancel();
    orders = orders.map((item) =>
      item.id === id ? ProductionMapper.orderToDTO(order) : item,
    );

    return order;
  }

  async create(order: ProductionOrder) {
    orders = [ProductionMapper.orderToDTO(order), ...orders];

    return order;
  }

  async findAll() {
    return orders.map(ProductionMapper.orderToEntity);
  }

  async findById(id: string) {
    const order = orders.find((item) => item.id === id);

    return order ? ProductionMapper.orderToEntity(order) : null;
  }

  async finish(id: string) {
    const order = await this.requireById(id);

    order.finish();
    orders = orders.map((item) =>
      item.id === id ? ProductionMapper.orderToDTO(order) : item,
    );

    return order;
  }

  async start(id: string) {
    const order = await this.requireById(id);

    order.start();
    orders = orders.map((item) =>
      item.id === id ? ProductionMapper.orderToDTO(order) : item,
    );

    return order;
  }

  private async requireById(id: string) {
    const order = await this.findById(id);

    if (!order) {
      throw new Error("Producao nao encontrada");
    }

    return order;
  }
}
