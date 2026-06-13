import {
  CreateCustomerUseCase,
  CreateProductUseCase,
  CreateSupplierUseCase,
  DeactivateCustomerUseCase,
  DeactivateProductUseCase,
  DeactivateSupplierUseCase,
  ListCustomersUseCase,
  ListProductsUseCase,
  ListSuppliersUseCase,
  UpdateCustomerUseCase,
  UpdateProductUseCase,
  UpdateSupplierUseCase,
} from "@paobom/domain";

import { appConfig } from "@/core/config/app-config";
import { ApiClient } from "@/core/infrastructure/api/api-client";
import { eventBus } from "@/core/infrastructure/events/event-bus";
import { MemoryStorage } from "@/core/infrastructure/storage/storage";
import { MockCustomerRepository } from "@/features/customer/data/repositories/MockCustomerRepository";
import { MockHealthRepository } from "@/features/health/data/repositories/MockHealthRepository";
import { GetSystemHealthUseCase } from "@/features/health/domain/usecases/GetSystemHealthUseCase";
import { MockProductRepository } from "@/features/product/data/repositories/MockProductRepository";
import { MockSupplierRepository } from "@/features/supplier/data/repositories/MockSupplierRepository";

import { container } from "./container";
import { TOKENS } from "./tokens";

let bootstrapped = false;

export function bootstrapContainer() {
  if (bootstrapped) {
    return;
  }

  container.register(TOKENS.apiClient, () => new ApiClient(appConfig.apiBaseUrl));
  container.register(TOKENS.eventBus, () => eventBus);
  container.register(TOKENS.storage, () => new MemoryStorage());
  container.register(TOKENS.healthRepository, () => new MockHealthRepository());
  container.register(TOKENS.productRepository, () => new MockProductRepository());
  container.register(TOKENS.supplierRepository, () => new MockSupplierRepository());
  container.register(TOKENS.customerRepository, () => new MockCustomerRepository());
  container.register(
    TOKENS.getSystemHealthUseCase,
    () =>
      new GetSystemHealthUseCase(
        container.get(TOKENS.healthRepository),
        container.get(TOKENS.eventBus),
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

  bootstrapped = true;
}
