import {
  ProductionOrder,
  ProductionOrderRepository,
} from "@paobom/domain";

import { ProductionOrderDTO } from "@/features/production/data/dto/ProductionDTO";
import { ProductionMapper } from "@/features/production/data/mappers/ProductionMapper";

let orders: ProductionOrderDTO[] = [];

export class MockProductionOrderRepository implements ProductionOrderRepository {
  async create(order: ProductionOrder) {
    orders = [ProductionMapper.orderToDTO(order), ...orders];

    return order;
  }

  async findAll() {
    return orders.map(ProductionMapper.orderToEntity);
  }
}
