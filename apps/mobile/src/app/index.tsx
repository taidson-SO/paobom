import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/core/theme/theme";
import { MobileOperationsHome } from "@/features/operations/presentation/components/MobileOperationsHome";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <MobileOperationsHome />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});
