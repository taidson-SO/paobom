export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}

export class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
