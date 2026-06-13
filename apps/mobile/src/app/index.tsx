import { SafeAreaView, StyleSheet, View } from "react-native";

import { theme } from "@/core/theme/theme";
import { HealthStatusCard } from "@/features/health/presentation/components/HealthStatusCard";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <HealthStatusCard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
  },
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center",
  },
});
