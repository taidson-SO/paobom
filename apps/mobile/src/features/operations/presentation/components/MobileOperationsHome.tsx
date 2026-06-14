import { ReactNode, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "@/core/theme/theme";
import { useOperationsOverview } from "@/features/operations/presentation/hooks/useOperationsOverview";

type TabKey = "overview" | "stock" | "sales" | "production" | "cash" | "audit";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Resumo" },
  { key: "stock", label: "Estoque" },
  { key: "sales", label: "Vendas" },
  { key: "production", label: "Producao" },
  { key: "cash", label: "Caixa" },
  { key: "audit", label: "Auditoria" },
];

export function MobileOperationsHome() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { data, isLoading, refetch } = useOperationsOverview();
  const productNames = useMemo(
    () =>
      new Map(
        data?.products.map((product) => [product.id, product.name]) ?? [],
      ),
    [data?.products],
  );

  if (isLoading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando operacao</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={() => {
            void refetch();
          }}
          refreshing={isLoading}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Paobom ERP</Text>
          <Text style={styles.title}>Operacao mobile</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>
            {data.dashboard.executive.healthScore}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroller}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key ? styles.tabActive : null]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key ? styles.tabTextActive : null,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === "overview" ? (
        <View style={styles.section}>
          <View style={styles.metricGrid}>
            <MetricCard
              label="Receita"
              value={formatCurrency(data.dashboard.sales.revenue)}
            />
            <MetricCard
              label="Resultado"
              tone={data.dashboard.executive.netResult < 0 ? "danger" : "ok"}
              value={formatCurrency(data.dashboard.executive.netResult)}
            />
            <MetricCard
              label="Caixa proj."
              tone={data.dashboard.cash.projectedBalance < 0 ? "danger" : "ok"}
              value={formatCurrency(data.dashboard.cash.projectedBalance)}
            />
            <MetricCard
              label="Estoque"
              value={formatCurrency(data.dashboard.inventory.estimatedValue)}
            />
          </View>
          <Panel title="Focos executivos">
            {data.dashboard.focusAreas.length ? (
              data.dashboard.focusAreas.map((focus) => (
                <ListRow
                  key={focus.id}
                  primary={focus.title}
                  secondary={focus.description}
                  value={focus.metric}
                />
              ))
            ) : (
              <EmptyState text="Sem focos criticos no momento" />
            )}
          </Panel>
        </View>
      ) : null}

      {activeTab === "stock" ? (
        <Panel title="Saldos criticos e cobertura">
          {data.balances.map((balance) => (
            <ListRow
              key={balance.productId}
              primary={productNames.get(balance.productId) ?? "Produto"}
              secondary={`Saldo ${balance.quantity} | minimo ${balance.minimumStock}`}
              status={balance.isBelowMinimum ? "Abaixo" : "OK"}
              value={formatCurrency(balance.estimatedValue)}
            />
          ))}
        </Panel>
      ) : null}

      {activeTab === "sales" ? (
        <Panel title="Vendas recentes">
          {data.sales.map((sale) => (
            <ListRow
              key={sale.id}
              primary={sale.customerId ?? "Consumidor final"}
              secondary={`${sale.items.length} item(ns) | ${sale.paymentMethod}`}
              status={sale.status}
              value={formatCurrency(sale.total)}
            />
          ))}
        </Panel>
      ) : null}

      {activeTab === "production" ? (
        <Panel title="Ordens de producao">
          {data.productionOrders.map((order) => (
            <ListRow
              key={order.id}
              primary={order.recipeSnapshot.recipeName}
              secondary={`${order.quantityProduced} un. | custo ${formatCurrency(order.totalCost)}`}
              status={order.status}
              value={formatCurrency(order.unitCost)}
            />
          ))}
        </Panel>
      ) : null}

      {activeTab === "cash" ? (
        <Panel title="Lancamentos financeiros">
          {data.cashEntries.map((entry) => (
            <ListRow
              key={entry.id}
              primary={entry.description}
              secondary={`${entry.category} | ${entry.status}`}
              status={entry.type === "income" ? "Entrada" : "Saida"}
              value={formatCurrency(entry.amount)}
            />
          ))}
        </Panel>
      ) : null}

      {activeTab === "audit" ? (
        <Panel title="Eventos auditados">
          {data.auditLogs.map((log) => (
            <ListRow
              key={log.id}
              primary={log.action}
              secondary={`${log.userName} | ${log.occurredAt.toLocaleDateString()}`}
              status={log.result === "success" ? "Sucesso" : "Falha"}
              value={log.entity}
            />
          ))}
        </Panel>
      ) : null}
    </ScrollView>
  );
}

function MetricCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "danger" | "neutral" | "ok";
  value: string;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        tone === "danger" ? styles.metricDanger : null,
        tone === "ok" ? styles.metricOk : null,
      ]}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Panel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function ListRow({
  primary,
  secondary,
  status,
  value,
}: {
  primary: string;
  secondary: string;
  status?: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowPrimary}>{primary}</Text>
        <Text style={styles.rowSecondary}>{secondary}</Text>
      </View>
      <View style={styles.rowAside}>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: "48%",
    padding: theme.spacing.md,
  },
  metricDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  metricOk: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  metricValue: {
    color: theme.colors.foreground,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelBody: {
    paddingHorizontal: theme.spacing.md,
  },
  panelTitle: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: "900",
    padding: theme.spacing.md,
  },
  row: {
    alignItems: "center",
    borderBottomColor: "#f4f4f5",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
  },
  rowAside: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 120,
  },
  rowMain: {
    flex: 1,
  },
  rowPrimary: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  rowSecondary: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  rowValue: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: "900",
  },
  scoreBadge: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 72,
    padding: theme.spacing.sm,
  },
  scoreLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  scoreValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  section: {
    gap: theme.spacing.md,
  },
  status: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  tab: {
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabScroller: {
    flexGrow: 0,
  },
  tabText: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
});
