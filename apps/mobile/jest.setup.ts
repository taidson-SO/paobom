import { afterEach, beforeEach, jest } from "@jest/globals";
import { cleanup } from "@testing-library/react-native";

import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";

jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(async () => false),
  setItemAsync: jest.fn(),
}));

beforeEach(() => {
  useAuthStore.setState({
    session: null,
    status: "unauthenticated",
  });
});

afterEach(async () => {
  await cleanup();
});
