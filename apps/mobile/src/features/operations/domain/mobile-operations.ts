export type MobileProduct = {
  active: boolean;
  id: string;
  kind: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  sku: string;
  unit: string;
};

export type MobileInventoryBalance = {
  averageCost: number;
  minimumStock: number;
  product: MobileProduct;
  productId: string;
  quantity: number;
};

export type MobileProductionOrder = {
  id: string;
  notes: string;
  outputProductName: string;
  quantityProduced: number;
  recipeName: string;
  recipeVersion: number;
  status: "planned" | "started" | "finished" | "cancelled";
};

export type SimpleSaleInput = {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes: string;
  paymentMethod: "cash" | "card" | "pix";
};

export type MobileOperationsSnapshot = {
  balances: MobileInventoryBalance[];
  productionOrders: MobileProductionOrder[];
  products: MobileProduct[];
};

export interface MobileOperationsRepository {
  createSimpleSale(input: SimpleSaleInput): Promise<{ id: string }>;
  finishProductionOrder(id: string): Promise<void>;
  getSnapshot(permissions: string[]): Promise<MobileOperationsSnapshot>;
  registerLoss(input: {
    productId: string;
    quantity: number;
    reason: string;
  }): Promise<void>;
  startProductionOrder(id: string): Promise<void>;
}
