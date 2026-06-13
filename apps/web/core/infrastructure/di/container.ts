type Factory<TValue> = () => TValue;

export class Container {
  private readonly factories = new Map<symbol, Factory<unknown>>();

  get<TValue>(token: symbol): TValue {
    const factory = this.factories.get(token);

    if (!factory) {
      throw new Error("Dependency not registered");
    }

    return factory() as TValue;
  }

  register<TValue>(token: symbol, factory: Factory<TValue>) {
    this.factories.set(token, factory);
  }
}

export const container = new Container();
