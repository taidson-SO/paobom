import { Stack } from "expo-router";

import { bootstrapAppContainer } from "@/app/bootstrap-container";
import { AppProviders } from "@/core/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders bootstrap={bootstrapAppContainer}>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
