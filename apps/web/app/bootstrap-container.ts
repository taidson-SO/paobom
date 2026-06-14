"use client";

import {
  CancelCashEntryUseCase,
  CancelCustomerInteractionUseCase,
  CancelPurchaseUseCase,
  CancelSaleUseCase,
  CompleteCustomerInteractionUseCase,
  CreateCustomerUseCase,
  CreateProductUseCase,
  CreateProductionOrderUseCase,
  CreatePurchaseUseCase,
  CreateRecipeUseCase,
  CreateSaleUseCase,
  CreateSupplierUseCase,
  DeactivateCustomerUseCase,
  DeactivateProductUseCase,
  DeactivateSupplierUseCase,
  GetCashFlowSummaryUseCase,
  GetBusinessDashboardUseCase,
  GetBusinessReportsUseCase,
  GetCustomerRelationshipSummaryUseCase,
  ListCashEntriesUseCase,
  ListCustomerInteractionsUseCase,
  ListCustomersUseCase,
  ListInventoryBalancesUseCase,
  ListProductsUseCase,
  ListProductionOrdersUseCase,
  ListPurchasesUseCase,
  ListRecipesUseCase,
  ListSalesUseCase,
  ListStockMovementsUseCase,
  ListSuppliersUseCase,
  PaySaleUseCase,
  ReceivePurchaseUseCase,
  RegisterCashEntryUseCase,
  RegisterCustomerInteractionUseCase,
  RegisterInventoryAdjustmentUseCase,
  RegisterLossUseCase,
  SettleCashEntryUseCase,
  UpdateCustomerUseCase,
  UpdateProductUseCase,
  UpdateSupplierUseCase,
} from "@paobom/domain";

import { container } from "@/core/infrastructure/di/container";
import { bootstrapCoreContainer } from "@/core/infrastructure/di/bootstrap";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { eventBus } from "@/core/infrastructure/events/event-bus";
import { MockCustomerRelationshipRepository } from "@/features/customer-relationship/data/repositories/MockCustomerRelationshipRepository";
import { MockCustomerRepository } from "@/features/customer/data/repositories/MockCustomerRepository";
import { EventPurchaseFinanceGateway } from "@/features/finance/data/gateways/EventPurchaseFinanceGateway";
import { MockCashFlowRepository } from "@/features/finance/data/repositories/MockCashFlowRepository";
import { MockHealthRepository } from "@/features/health/data/repositories/MockHealthRepository";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";
import { MockInventoryRepository } from "@/features/inventory/data/repositories/MockInventoryRepository";
import { MockProductRepository } from "@/features/product/data/repositories/MockProductRepository";
import { EventProductionInventoryGateway } from "@/features/production/data/gateways/EventProductionInventoryGateway";
import { MockProductionOrderRepository } from "@/features/production/data/repositories/MockProductionOrderRepository";
import { MockRecipeRepository } from "@/features/production/data/repositories/MockRecipeRepository";
import { MockPurchaseInventoryGateway } from "@/features/purchase/data/gateways/MockPurchaseInventoryGateway";
import { MockPurchaseRepository } from "@/features/purchase/data/repositories/MockPurchaseRepository";
import { EventSaleFinanceGateway } from "@/features/sales/data/gateways/EventSaleFinanceGateway";
import { EventSaleInventoryGateway } from "@/features/sales/data/gateways/EventSaleInventoryGateway";
import { MockSaleRepository } from "@/features/sales/data/repositories/MockSaleRepository";
import { MockSupplierRepository } from "@/features/supplier/data/repositories/MockSupplierRepository";

let bootstrapped = false;

export function bootstrapAppContainer() {
  if (bootstrapped) {
    return;
  }

  bootstrapCoreContainer();

  container.register(TOKENS.healthRepository, () => new MockHealthRepository());
  container.register(TOKENS.productRepository, () => new MockProductRepository());
  container.register(TOKENS.supplierRepository, () => new MockSupplierRepository());
  container.register(TOKENS.customerRepository, () => new MockCustomerRepository());
  container.register(
    TOKENS.customerRelationshipRepository,
    () => new MockCustomerRelationshipRepository(),
  );
  container.register(
    TOKENS.cashFlowRepository,
    () => new MockCashFlowRepository(eventBus),
  );
  container.register(
    TOKENS.inventoryRepository,
    () => new MockInventoryRepository(eventBus),
  );
  container.register(TOKENS.recipeRepository, () => new MockRecipeRepository());
  container.register(TOKENS.saleRepository, () => new MockSaleRepository());
  container.register(
    TOKENS.productionOrderRepository,
    () => new MockProductionOrderRepository(),
  );
  container.register(
    TOKENS.productionInventoryGateway,
    () => new EventProductionInventoryGateway(),
  );
  container.register(TOKENS.purchaseRepository, () => new MockPurchaseRepository());
  container.register(
    TOKENS.purchaseInventoryGateway,
    () => new MockPurchaseInventoryGateway(),
  );
  container.register(
    TOKENS.purchaseFinanceGateway,
    () => new EventPurchaseFinanceGateway(),
  );
  container.register(
    TOKENS.saleInventoryGateway,
    () => new EventSaleInventoryGateway(),
  );
  container.register(
    TOKENS.saleFinanceGateway,
    () => new EventSaleFinanceGateway(),
  );
  registerUseCases();

  bootstrapped = true;
}

function registerUseCases() {
  container.register(
    TOKENS.getSystemHealthUseCase,
    () =>
      new GetSystemHealthUseCase(
        container.get(TOKENS.healthRepository),
        container.get(TOKENS.eventBus),
      ),
  );
  container.register(
    TOKENS.getBusinessDashboardUseCase,
    () =>
      new GetBusinessDashboardUseCase(
        container.get(TOKENS.saleRepository),
        container.get(TOKENS.cashFlowRepository),
        container.get(TOKENS.inventoryRepository),
        container.get(TOKENS.purchaseRepository),
        container.get(TOKENS.productionOrderRepository),
      ),
  );
  container.register(
    TOKENS.getBusinessReportsUseCase,
    () =>
      new GetBusinessReportsUseCase(
        container.get(TOKENS.saleRepository),
        container.get(TOKENS.cashFlowRepository),
        container.get(TOKENS.inventoryRepository),
        container.get(TOKENS.purchaseRepository),
        container.get(TOKENS.productionOrderRepository),
      ),
  );
  container.register(
    TOKENS.listProductsUseCase,
    () => new ListProductsUseCase(container.get(TOKENS.productRepository)),
  );
  container.register(
    TOKENS.createProductUseCase,
    () => new CreateProductUseCase(container.get(TOKENS.productRepository)),
  );
  container.register(
    TOKENS.updateProductUseCase,
    () => new UpdateProductUseCase(container.get(TOKENS.productRepository)),
  );
  container.register(
    TOKENS.deactivateProductUseCase,
    () => new DeactivateProductUseCase(container.get(TOKENS.productRepository)),
  );
  container.register(
    TOKENS.listSuppliersUseCase,
    () => new ListSuppliersUseCase(container.get(TOKENS.supplierRepository)),
  );
  container.register(
    TOKENS.createSupplierUseCase,
    () => new CreateSupplierUseCase(container.get(TOKENS.supplierRepository)),
  );
  container.register(
    TOKENS.updateSupplierUseCase,
    () => new UpdateSupplierUseCase(container.get(TOKENS.supplierRepository)),
  );
  container.register(
    TOKENS.deactivateSupplierUseCase,
    () =>
      new DeactivateSupplierUseCase(container.get(TOKENS.supplierRepository)),
  );
  container.register(
    TOKENS.listCustomersUseCase,
    () => new ListCustomersUseCase(container.get(TOKENS.customerRepository)),
  );
  container.register(
    TOKENS.createCustomerUseCase,
    () => new CreateCustomerUseCase(container.get(TOKENS.customerRepository)),
  );
  container.register(
    TOKENS.updateCustomerUseCase,
    () => new UpdateCustomerUseCase(container.get(TOKENS.customerRepository)),
  );
  container.register(
    TOKENS.deactivateCustomerUseCase,
    () =>
      new DeactivateCustomerUseCase(container.get(TOKENS.customerRepository)),
  );
  container.register(
    TOKENS.listCustomerInteractionsUseCase,
    () =>
      new ListCustomerInteractionsUseCase(
        container.get(TOKENS.customerRelationshipRepository),
      ),
  );
  container.register(
    TOKENS.getCustomerRelationshipSummaryUseCase,
    () =>
      new GetCustomerRelationshipSummaryUseCase(
        container.get(TOKENS.customerRelationshipRepository),
      ),
  );
  container.register(
    TOKENS.registerCustomerInteractionUseCase,
    () =>
      new RegisterCustomerInteractionUseCase(
        container.get(TOKENS.customerRelationshipRepository),
        container.get(TOKENS.customerRepository),
      ),
  );
  container.register(
    TOKENS.completeCustomerInteractionUseCase,
    () =>
      new CompleteCustomerInteractionUseCase(
        container.get(TOKENS.customerRelationshipRepository),
      ),
  );
  container.register(
    TOKENS.cancelCustomerInteractionUseCase,
    () =>
      new CancelCustomerInteractionUseCase(
        container.get(TOKENS.customerRelationshipRepository),
      ),
  );
  container.register(
    TOKENS.listPurchasesUseCase,
    () => new ListPurchasesUseCase(container.get(TOKENS.purchaseRepository)),
  );
  container.register(
    TOKENS.createPurchaseUseCase,
    () =>
      new CreatePurchaseUseCase(
        container.get(TOKENS.purchaseRepository),
        container.get(TOKENS.productRepository),
        container.get(TOKENS.supplierRepository),
        container.get(TOKENS.purchaseFinanceGateway),
      ),
  );
  container.register(
    TOKENS.receivePurchaseUseCase,
    () =>
      new ReceivePurchaseUseCase(
        container.get(TOKENS.purchaseRepository),
        container.get(TOKENS.purchaseInventoryGateway),
      ),
  );
  container.register(
    TOKENS.cancelPurchaseUseCase,
    () =>
      new CancelPurchaseUseCase(
        container.get(TOKENS.purchaseRepository),
        container.get(TOKENS.purchaseFinanceGateway),
      ),
  );
  container.register(
    TOKENS.listInventoryBalancesUseCase,
    () =>
      new ListInventoryBalancesUseCase(
        container.get(TOKENS.inventoryRepository),
      ),
  );
  container.register(
    TOKENS.listStockMovementsUseCase,
    () =>
      new ListStockMovementsUseCase(container.get(TOKENS.inventoryRepository)),
  );
  container.register(
    TOKENS.registerLossUseCase,
    () =>
      new RegisterLossUseCase(
        container.get(TOKENS.inventoryRepository),
        container.get(TOKENS.productRepository),
      ),
  );
  container.register(
    TOKENS.registerInventoryAdjustmentUseCase,
    () =>
      new RegisterInventoryAdjustmentUseCase(
        container.get(TOKENS.inventoryRepository),
        container.get(TOKENS.productRepository),
      ),
  );
  container.register(
    TOKENS.listRecipesUseCase,
    () => new ListRecipesUseCase(container.get(TOKENS.recipeRepository)),
  );
  container.register(
    TOKENS.createRecipeUseCase,
    () =>
      new CreateRecipeUseCase(
        container.get(TOKENS.recipeRepository),
        container.get(TOKENS.productRepository),
      ),
  );
  container.register(
    TOKENS.listProductionOrdersUseCase,
    () =>
      new ListProductionOrdersUseCase(
        container.get(TOKENS.productionOrderRepository),
      ),
  );
  container.register(
    TOKENS.createProductionOrderUseCase,
    () =>
      new CreateProductionOrderUseCase(
        container.get(TOKENS.productionOrderRepository),
        container.get(TOKENS.recipeRepository),
        container.get(TOKENS.productRepository),
        container.get(TOKENS.productionInventoryGateway),
      ),
  );
  container.register(
    TOKENS.listSalesUseCase,
    () => new ListSalesUseCase(container.get(TOKENS.saleRepository)),
  );
  container.register(
    TOKENS.createSaleUseCase,
    () =>
      new CreateSaleUseCase(
        container.get(TOKENS.saleRepository),
        container.get(TOKENS.productRepository),
        container.get(TOKENS.customerRepository),
        container.get(TOKENS.saleInventoryGateway),
        container.get(TOKENS.saleFinanceGateway),
      ),
  );
  container.register(
    TOKENS.paySaleUseCase,
    () =>
      new PaySaleUseCase(
        container.get(TOKENS.saleRepository),
        container.get(TOKENS.saleFinanceGateway),
      ),
  );
  container.register(
    TOKENS.cancelSaleUseCase,
    () =>
      new CancelSaleUseCase(
        container.get(TOKENS.saleRepository),
        container.get(TOKENS.saleFinanceGateway),
      ),
  );
  container.register(
    TOKENS.listCashEntriesUseCase,
    () => new ListCashEntriesUseCase(container.get(TOKENS.cashFlowRepository)),
  );
  container.register(
    TOKENS.getCashFlowSummaryUseCase,
    () =>
      new GetCashFlowSummaryUseCase(container.get(TOKENS.cashFlowRepository)),
  );
  container.register(
    TOKENS.registerCashEntryUseCase,
    () => new RegisterCashEntryUseCase(container.get(TOKENS.cashFlowRepository)),
  );
  container.register(
    TOKENS.settleCashEntryUseCase,
    () => new SettleCashEntryUseCase(container.get(TOKENS.cashFlowRepository)),
  );
  container.register(
    TOKENS.cancelCashEntryUseCase,
    () => new CancelCashEntryUseCase(container.get(TOKENS.cashFlowRepository)),
  );
}
