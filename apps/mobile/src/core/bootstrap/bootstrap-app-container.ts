import {
  GetBusinessDashboardUseCase,
  ListAuditLogsUseCase,
  ListCashEntriesUseCase,
  ListInventoryBalancesUseCase,
  ListProductionOrdersUseCase,
  ListProductsUseCase,
  ListSalesUseCase,
} from "@paobom/domain";

import { bootstrapCoreContainer } from "@/core/infrastructure/di/bootstrap";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { MockHealthRepository } from "@/features/health/data/repositories/MockHealthRepository";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";
import {
  MockBakeryOperationsRepository,
  MockMobileAuditLogRepository,
  MockMobileCashFlowRepository,
  MockMobileInventoryRepository,
  MockMobileProductionOrderRepository,
  MockMobilePurchaseRepository,
  MockMobileSaleRepository,
} from "@/features/operations/data/repositories/MockBakeryOperationsRepository";

let bootstrapped = false;
const productRepository = new MockBakeryOperationsRepository();
const inventoryRepository = new MockMobileInventoryRepository();
const saleRepository = new MockMobileSaleRepository();
const cashFlowRepository = new MockMobileCashFlowRepository();
const purchaseRepository = new MockMobilePurchaseRepository();
const productionOrderRepository = new MockMobileProductionOrderRepository();
const auditLogRepository = new MockMobileAuditLogRepository();

export function bootstrapAppContainer() {
  if (bootstrapped) {
    return;
  }

  bootstrapCoreContainer();

  container.register(TOKENS.productRepository, () => productRepository);
  container.register(TOKENS.inventoryRepository, () => inventoryRepository);
  container.register(TOKENS.saleRepository, () => saleRepository);
  container.register(TOKENS.cashFlowRepository, () => cashFlowRepository);
  container.register(TOKENS.purchaseRepository, () => purchaseRepository);
  container.register(
    TOKENS.productionOrderRepository,
    () => productionOrderRepository,
  );
  container.register(TOKENS.auditLogRepository, () => auditLogRepository);
  container.register(TOKENS.healthRepository, () => new MockHealthRepository());
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
    TOKENS.listProductsUseCase,
    () => new ListProductsUseCase(container.get(TOKENS.productRepository)),
  );
  container.register(
    TOKENS.listInventoryBalancesUseCase,
    () =>
      new ListInventoryBalancesUseCase(
        container.get(TOKENS.inventoryRepository),
      ),
  );
  container.register(
    TOKENS.listSalesUseCase,
    () => new ListSalesUseCase(container.get(TOKENS.saleRepository)),
  );
  container.register(
    TOKENS.listCashEntriesUseCase,
    () => new ListCashEntriesUseCase(container.get(TOKENS.cashFlowRepository)),
  );
  container.register(
    TOKENS.listProductionOrdersUseCase,
    () =>
      new ListProductionOrdersUseCase(
        container.get(TOKENS.productionOrderRepository),
      ),
  );
  container.register(
    TOKENS.listAuditLogsUseCase,
    () => new ListAuditLogsUseCase(container.get(TOKENS.auditLogRepository)),
  );
  container.register(
    TOKENS.getSystemHealthUseCase,
    () =>
      new GetSystemHealthUseCase(
        container.get(TOKENS.healthRepository),
        container.get(TOKENS.eventBus),
      ),
  );

  bootstrapped = true;
}
