import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/core/theme/theme";
import { useSystemHealth } from "@/features/health/presentation/hooks/useSystemHealth";

export function HealthStatusCard() {
  const health = useSystemHealth();

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Fundacao arquitetural</Text>
      <Text style={styles.title}>Paobom ERP</Text>
      <Text style={styles.description}>
        Base tecnica pronta para evoluir os dominios de compras, estoque,
        producao, caixa, clientes, dashboard e relatorios.
      </Text>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            health.isOperational ? styles.statusOk : styles.statusWarn,
          ]}
        />
        <Text style={styles.statusText}>
          {health.isLoading ? "Verificando..." : health.status}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={health.toggleDetails}>
        <Text style={styles.buttonText}>Detalhes</Text>
      </Pressable>

      {health.detailsVisible ? (
        <Text style={styles.details}>
          Ultima verificacao: {health.checkedAt?.toLocaleString() ?? "-"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  details: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  statusOk: {
    backgroundColor: "#16a34a",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.foreground,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusWarn: {
    backgroundColor: "#f59e0b",
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 28,
    fontWeight: "800",
  },
});
