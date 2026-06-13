import { Purchase, PurchaseInventoryGateway } from "@paobom/domain";

type PurchaseReceiptMovement = {
  productId: string;
  purchaseId: string;
  quantity: number;
  unitCost: number;
};

export const purchaseReceiptMovements: PurchaseReceiptMovement[] = [];

export class MockPurchaseInventoryGateway implements PurchaseInventoryGateway {
  async registerReceipt(purchase: Purchase) {
    purchaseReceiptMovements.push(
      ...purchase.items.map((item) => ({
        productId: item.productId,
        purchaseId: purchase.id,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    );
  }
}
