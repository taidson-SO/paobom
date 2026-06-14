import {
  GetBusinessDashboardUseCase,
  ListAuditLogsUseCase,
  ListCashEntriesUseCase,
  ListInventoryBalancesUseCase,
  ListProductionOrdersUseCase,
  ListProductsUseCase,
  ListSalesUseCase,
} from "@paobom/domain";
import { useQuery } from "@tanstack/react-query";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";

import { operationsQueryKeys } from "./keys";

export function useOperationsOverviewQuery() {
  return useQuery({
    queryFn: async () => {
      const dashboardUseCase = container.get<GetBusinessDashboardUseCase>(
        TOKENS.getBusinessDashboardUseCase,
      );
      const productsUseCase = container.get<ListProductsUseCase>(
        TOKENS.listProductsUseCase,
      );
      const balancesUseCase = container.get<ListInventoryBalancesUseCase>(
        TOKENS.listInventoryBalancesUseCase,
      );
      const salesUseCase = container.get<ListSalesUseCase>(
        TOKENS.listSalesUseCase,
      );
      const cashEntriesUseCase = container.get<ListCashEntriesUseCase>(
        TOKENS.listCashEntriesUseCase,
      );
      const productionOrdersUseCase =
        container.get<ListProductionOrdersUseCase>(
          TOKENS.listProductionOrdersUseCase,
        );
      const auditLogsUseCase = container.get<ListAuditLogsUseCase>(
        TOKENS.listAuditLogsUseCase,
      );

      const [
        dashboard,
        products,
        balances,
        sales,
        cashEntries,
        productionOrders,
        auditLogs,
      ] = await Promise.all([
        dashboardUseCase.execute(),
        productsUseCase.execute(),
        balancesUseCase.execute(),
        salesUseCase.execute(),
        cashEntriesUseCase.execute(),
        productionOrdersUseCase.execute(),
        auditLogsUseCase.execute(),
      ]);

      return {
        auditLogs,
        balances,
        cashEntries,
        dashboard,
        productionOrders,
        products,
        sales,
      };
    },
    queryKey: operationsQueryKeys.overview,
  });
}
