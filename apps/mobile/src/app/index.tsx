import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/core/theme/theme";
import { LoginScreen } from "@/features/auth/presentation/components/LoginScreen";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";
import { MobileOperationsHome } from "@/features/operations/presentation/components/MobileOperationsHome";

export default function HomeScreen() {
  const session = useAuthStore((state) => state.session);

  return (
    <SafeAreaView style={styles.screen}>
      {session ? <MobileOperationsHome /> : <LoginScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});
