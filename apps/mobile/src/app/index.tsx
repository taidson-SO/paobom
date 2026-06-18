import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/core/theme/theme";
import { LoginScreen } from "@/features/auth/presentation/components/LoginScreen";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";
import { MobileOperationsHome } from "@/features/operations/presentation/components/MobileOperationsHome";

export default function HomeScreen() {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  return (
    <SafeAreaView style={styles.screen}>
      {status === "loading" ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Restaurando sessao</Text>
        </View>
      ) : session ? (
        <MobileOperationsHome />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  loadingText: {
    color: theme.colors.muted,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});
