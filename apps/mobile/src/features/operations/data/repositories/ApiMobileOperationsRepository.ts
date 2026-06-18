import { ApiClient } from "@/core/infrastructure/api/api-client";
import {
  MobileInventoryBalance,
  MobileOperationsRepository,
  MobileProduct,
  MobileProductionOrder,
  SimpleSaleInput,
} from "@/features/operations/domain/mobile-operations";

type ProductDTO = Omit<MobileProduct, "purchasePrice" | "salePrice"> & {
  purchasePrice: number | string;
  salePrice: number | string | null;
};

type BalanceDTO = {
  averageCost: number | string;
  minimumStock: number | string;
  product: ProductDTO;
  productId: string;
  quantity: number | string;
};

type ProductionOrderDTO = {
  id: string;
  notes: string;
  outputProduct?: { name: string };
  quantityProduced: number | string;
  recipe?: { name: string; version: number };
  recipeSnapshot?: {
    recipeName?: string;
    recipeVersion?: number;
  };
  status: MobileProductionOrder["status"];
};

export class ApiMobileOperationsRepository
  implements MobileOperationsRepository
{
  constructor(private readonly apiClient: ApiClient) {}

  async getSnapshot(permissions: string[]) {
    const canViewProducts = permissions.includes("product:view");
    const canViewInventory = permissions.includes("inventory:view");
    const canViewProduction = permissions.includes("production:view");
    const [products, balances, productionOrders] = await Promise.all([
      canViewProducts
        ? this.apiClient.get<ProductDTO[]>("/products?active=true")
        : Promise.resolve([]),
      canViewInventory
        ? this.apiClient.get<BalanceDTO[]>("/inventory/balances")
        : Promise.resolve([]),
      canViewProduction
        ? this.apiClient.get<ProductionOrderDTO[]>("/production/orders")
        : Promise.resolve([]),
    ]);

    return {
      balances: balances.map(mapBalance),
      productionOrders: productionOrders.map(mapProductionOrder),
      products: products.map(mapProduct),
    };
  }

  async registerLoss(input: {
    productId: string;
    quantity: number;
    reason: string;
  }) {
    await this.apiClient.post("/inventory/losses", input);
  }

  async startProductionOrder(id: string) {
    await this.apiClient.post(`/production/orders/${id}/start`, {});
  }

  async finishProductionOrder(id: string) {
    await this.apiClient.post(`/production/orders/${id}/finish`, {});
  }

  async createSimpleSale(input: SimpleSaleInput) {
    return this.apiClient.post<{ id: string }>("/sales", {
      discountAmount: 0,
      ...input,
    });
  }
}

function mapProduct(product: ProductDTO): MobileProduct {
  return {
    ...product,
    purchasePrice: Number(product.purchasePrice),
    salePrice: Number(product.salePrice ?? 0),
  };
}

function mapBalance(balance: BalanceDTO): MobileInventoryBalance {
  return {
    averageCost: Number(balance.averageCost),
    minimumStock: Number(balance.minimumStock),
    product: mapProduct(balance.product),
    productId: balance.productId,
    quantity: Number(balance.quantity),
  };
}

function mapProductionOrder(order: ProductionOrderDTO): MobileProductionOrder {
  return {
    id: order.id,
    notes: order.notes,
    outputProductName: order.outputProduct?.name ?? "Produto",
    quantityProduced: Number(order.quantityProduced),
    recipeName:
      order.recipeSnapshot?.recipeName ?? order.recipe?.name ?? "Receita",
    recipeVersion:
      order.recipeSnapshot?.recipeVersion ?? order.recipe?.version ?? 1,
    status: order.status,
  };
}
