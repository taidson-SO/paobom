import * as SecureStore from "expo-secure-store";

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}

export class SecureKeyValueStorage implements KeyValueStorage {
  private readonly fallback = new Map<string, string>();

  async getItem(key: string) {
    if (await SecureStore.isAvailableAsync()) {
      return SecureStore.getItemAsync(key);
    }

    return this.fallback.get(key) ?? null;
  }

  async removeItem(key: string) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    this.fallback.delete(key);
  }

  async setItem(key: string, value: string) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return;
    }

    this.fallback.set(key, value);
  }
}
