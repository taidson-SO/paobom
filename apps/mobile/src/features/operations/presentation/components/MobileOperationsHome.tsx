import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { theme } from "@/core/theme/theme";
import { AuthRepository } from "@/features/auth/domain/auth";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";
import {
  MobileInventoryBalance,
  MobileProductionOrder,
  MobileProduct,
  SimpleSaleInput,
} from "@/features/operations/domain/mobile-operations";
import { useTransactionalOperations } from "@/features/operations/presentation/hooks/useTransactionalOperations";

type TabKey = "home" | "stock" | "production" | "sales";
type CartLine = {
  product: MobileProduct;
  quantity: number;
};

export function MobileOperationsHome() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const operations = useTransactionalOperations();
  const permissions = useMemo(
    () => session?.user.permissions ?? [],
    [session?.user.permissions],
  );
  const tabs = useMemo(
    () =>
      [
        { key: "home" as const, label: "Inicio", visible: true },
        {
          key: "stock" as const,
          label: "Estoque",
          visible:
            permissions.includes("inventory:view") ||
            permissions.includes("inventory:register-loss"),
        },
        {
          key: "production" as const,
          label: "Producao",
          visible: permissions.includes("production:view"),
        },
        {
          key: "sales" as const,
          label: "Venda",
          visible: permissions.includes("sales:create"),
        },
      ].filter((tab) => tab.visible),
    [permissions],
  );
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [notice, setNotice] = useState<string | null>(null);

  async function logout() {
    try {
      await container.get<AuthRepository>(TOKENS.authRepository).logout();
    } finally {
      queryClient.clear();
      clearSession();
    }
  }

  if (operations.snapshot.isLoading) {
    return <LoadingState text="Sincronizando operacao" />;
  }

  if (operations.snapshot.error || !operations.snapshot.data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Nao foi possivel conectar</Text>
        <Text style={styles.errorText}>
          {operations.snapshot.error?.message ?? "Servidor indisponivel"}
        </Text>
        <ActionButton
          label="Tentar novamente"
          onPress={() => void operations.snapshot.refetch()}
        />
        <SecondaryButton label="Sair" onPress={() => void logout()} />
      </View>
    );
  }

  const data = operations.snapshot.data;
  const sellableProducts = data.products.filter(
    (product) =>
      product.active &&
      product.salePrice > 0 &&
      ["finished_product", "resale"].includes(product.kind),
  );
  const activeProductions = data.productionOrders.filter(
    (order) => order.status === "planned" || order.status === "started",
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          onRefresh={() => void operations.snapshot.refetch()}
          refreshing={operations.snapshot.isRefetching}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <Text style={styles.eyebrow}>PaoBom ERP</Text>
          <Text style={styles.title}>{session?.user.name}</Text>
          <Text style={styles.role}>{formatRole(session?.user.role)}</Text>
        </View>
        <SecondaryButton label="Sair" onPress={() => void logout()} compact />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                setNotice(null);
              }}
              style={[
                styles.tab,
                activeTab === tab.key ? styles.tabActive : null,
              ]}
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
        </View>
      </ScrollView>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {activeTab === "home" ? (
        <HomePanel
          belowMinimum={data.balances.filter(
            (balance) => balance.quantity < balance.minimumStock,
          ).length}
          productionCount={activeProductions.length}
          sellableCount={sellableProducts.length}
          tabs={tabs}
          onNavigate={setActiveTab}
        />
      ) : null}

      {activeTab === "stock" ? (
        <StockPanel
          balances={data.balances}
          canRegisterLoss={permissions.includes("inventory:register-loss")}
          isPending={operations.registerLoss.isPending}
          onSubmit={async (input) => {
            await operations.registerLoss.mutateAsync(input);
            setNotice("Perda registrada e saldo atualizado.");
          }}
        />
      ) : null}

      {activeTab === "production" ? (
        <ProductionPanel
          canManage={permissions.includes("production:manage-order")}
          finishPending={operations.finishProduction.isPending}
          onFinish={async (id) => {
            await operations.finishProduction.mutateAsync(id);
            setNotice("Producao finalizada e entrada registrada no estoque.");
          }}
          onStart={async (id) => {
            await operations.startProduction.mutateAsync(id);
            setNotice("Producao iniciada e insumos baixados do estoque.");
          }}
          orders={data.productionOrders}
          startPending={operations.startProduction.isPending}
        />
      ) : null}

      {activeTab === "sales" ? (
        <SalesPanel
          isPending={operations.createSale.isPending}
          onSubmit={async (input) => {
            const sale = await operations.createSale.mutateAsync(input);
            setNotice(`Venda ${shortId(sale.id)} concluida com sucesso.`);
          }}
          products={sellableProducts}
        />
      ) : null}
    </ScrollView>
  );
}

function HomePanel({
  belowMinimum,
  onNavigate,
  productionCount,
  sellableCount,
  tabs,
}: {
  belowMinimum: number;
  onNavigate: (tab: TabKey) => void;
  productionCount: number;
  sellableCount: number;
  tabs: { key: TabKey; label: string }[];
}) {
  const visibleActions = tabs.filter((tab) => tab.key !== "home");

  return (
    <View style={styles.section}>
      <View style={styles.metrics}>
        <Metric label="Abaixo do minimo" value={String(belowMinimum)} warning />
        <Metric label="Producoes ativas" value={String(productionCount)} />
        <Metric label="Itens a venda" value={String(sellableCount)} />
      </View>
      <Section title="Acoes operacionais">
        {visibleActions.length ? (
          visibleActions.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => onNavigate(tab.key)}
              style={styles.actionRow}
            >
              <Text style={styles.actionRowTitle}>{tab.label}</Text>
              <Text style={styles.actionRowArrow}>›</Text>
            </Pressable>
          ))
        ) : (
          <EmptyState text="Este perfil possui acesso apenas de consulta." />
        )}
      </Section>
    </View>
  );
}

function StockPanel({
  balances,
  canRegisterLoss,
  isPending,
  onSubmit,
}: {
  balances: MobileInventoryBalance[];
  canRegisterLoss: boolean;
  isPending: boolean;
  onSubmit: (input: {
    productId: string;
    quantity: number;
    reason: string;
  }) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selected = balances.find((balance) => balance.productId === selectedId);

  async function submit() {
    const parsedQuantity = Number(quantity.replace(",", "."));

    if (!selected || parsedQuantity <= 0 || reason.trim().length < 2) {
      setError("Selecione o produto, informe a quantidade e a justificativa.");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        productId: selected.productId,
        quantity: parsedQuantity,
        reason: reason.trim(),
      });
      setQuantity("");
      setReason("");
      setSelectedId(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <View style={styles.section}>
      <Section title="Saldos atuais">
        {balances.map((balance) => (
          <Pressable
            key={balance.productId}
            disabled={!canRegisterLoss}
            onPress={() => setSelectedId(balance.productId)}
            style={[
              styles.listRow,
              selectedId === balance.productId ? styles.listRowSelected : null,
            ]}
          >
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{balance.product.name}</Text>
              <Text style={styles.listMeta}>
                Minimo {formatQuantity(balance.minimumStock)} {balance.product.unit}
              </Text>
            </View>
            <Text
              style={[
                styles.balanceValue,
                balance.quantity < balance.minimumStock
                  ? styles.dangerText
                  : null,
              ]}
            >
              {formatQuantity(balance.quantity)}
            </Text>
          </Pressable>
        ))}
      </Section>

      {canRegisterLoss ? (
        <Section title="Registrar perda">
          <Text style={styles.selectedLabel}>
            {selected
              ? selected.product.name
              : "Toque em um produto da lista para selecionar"}
          </Text>
          <Field
            keyboardType="decimal-pad"
            label="Quantidade perdida"
            onChangeText={setQuantity}
            placeholder="0"
            value={quantity}
          />
          <Field
            label="Motivo"
            onChangeText={setReason}
            placeholder="Ex.: validade, quebra ou avaria"
            value={reason}
          />
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          <ActionButton
            disabled={isPending}
            label={isPending ? "Registrando..." : "Confirmar perda"}
            onPress={() => void submit()}
          />
        </Section>
      ) : null}
    </View>
  );
}

function ProductionPanel({
  canManage,
  finishPending,
  onFinish,
  onStart,
  orders,
  startPending,
}: {
  canManage: boolean;
  finishPending: boolean;
  onFinish: (id: string) => Promise<void>;
  onStart: (id: string) => Promise<void>;
  orders: MobileProductionOrder[];
  startPending: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const activeOrders = orders.filter(
    (order) => order.status === "planned" || order.status === "started",
  );

  async function run(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <Section title="Ordens em operacao">
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      {activeOrders.length ? (
        activeOrders.map((order) => (
          <View key={order.id} style={styles.productionRow}>
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{order.recipeName}</Text>
              <Text style={styles.listMeta}>
                v{order.recipeVersion} · {formatQuantity(order.quantityProduced)}{" "}
                {order.outputProductName}
              </Text>
              {order.notes ? (
                <Text style={styles.listMeta}>{order.notes}</Text>
              ) : null}
            </View>
            <View style={styles.productionAside}>
              <Status text={order.status === "planned" ? "Planejada" : "Em curso"} />
              {canManage && order.status === "planned" ? (
                <SmallButton
                  disabled={startPending}
                  label="Iniciar"
                  onPress={() => void run(() => onStart(order.id))}
                />
              ) : null}
              {canManage && order.status === "started" ? (
                <SmallButton
                  disabled={finishPending}
                  label="Finalizar"
                  onPress={() => void run(() => onFinish(order.id))}
                />
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <EmptyState text="Nenhuma ordem planejada ou em andamento." />
      )}
    </Section>
  );
}

function SalesPanel({
  isPending,
  onSubmit,
  products,
}: {
  isPending: boolean;
  onSubmit: (input: SimpleSaleInput) => Promise<void>;
  products: MobileProduct[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] =
    useState<SimpleSaleInput["paymentMethod"]>("pix");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const total = cart.reduce(
    (sum, line) => sum + line.quantity * line.product.salePrice,
    0,
  );

  function addProduct(product: MobileProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);

      return existing
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function submit() {
    if (!cart.length) {
      setError("Adicione pelo menos um produto a venda.");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          unitPrice: line.product.salePrice,
        })),
        notes: notes.trim() || "Venda mobile",
        paymentMethod: method,
      });
      setCart([]);
      setNotes("");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <View style={styles.section}>
      <Section title="Adicionar produtos">
        {products.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => addProduct(product)}
            style={styles.listRow}
          >
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{product.name}</Text>
              <Text style={styles.listMeta}>{product.sku}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(product.salePrice)}</Text>
          </Pressable>
        ))}
      </Section>

      <Section title="Venda atual">
        {cart.length ? (
          cart.map((line) => (
            <View key={line.product.id} style={styles.cartRow}>
              <View style={styles.listMain}>
                <Text style={styles.listTitle}>{line.product.name}</Text>
                <Text style={styles.listMeta}>
                  {formatCurrency(line.quantity * line.product.salePrice)}
                </Text>
              </View>
              <View style={styles.stepper}>
                <SmallButton
                  label="−"
                  onPress={() => changeQuantity(line.product.id, -1)}
                  square
                />
                <Text style={styles.stepperValue}>{line.quantity}</Text>
                <SmallButton
                  label="+"
                  onPress={() => changeQuantity(line.product.id, 1)}
                  square
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="Toque em um produto para adicionar." />
        )}

        <Text style={styles.fieldLabel}>Forma de pagamento</Text>
        <View style={styles.segmented}>
          {(["cash", "card", "pix"] as const).map((paymentMethod) => (
            <Pressable
              key={paymentMethod}
              onPress={() => setMethod(paymentMethod)}
              style={[
                styles.segment,
                method === paymentMethod ? styles.segmentActive : null,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  method === paymentMethod ? styles.segmentTextActive : null,
                ]}
              >
                {formatPayment(paymentMethod)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          label="Observacao"
          onChangeText={setNotes}
          placeholder="Opcional"
          value={notes}
        />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        <ActionButton
          disabled={isPending || !cart.length}
          label={isPending ? "Finalizando..." : "Finalizar venda"}
          onPress={() => void submit()}
        />
      </Section>
    </View>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function Metric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.metric, warning ? styles.metricWarning : null]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Field({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: "decimal-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function ActionButton({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  compact = false,
  label,
  onPress,
}: {
  compact?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.secondaryButton, compact ? styles.compactButton : null]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  disabled = false,
  label,
  onPress,
  square = false,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  square?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.smallButton,
        square ? styles.squareButton : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function Status({ text }: { text: string }) {
  return <Text style={styles.status}>{text}</Text>;
}

function EmptyState({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Nao foi possivel concluir a acao";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function formatPayment(method: SimpleSaleInput["paymentMethod"]) {
  return { card: "Cartao", cash: "Dinheiro", pix: "Pix" }[method];
}

function formatRole(role?: string) {
  return (
    {
      baker: "Producao",
      cashier: "Caixa",
      manager: "Gerencia",
      owner: "Proprietario",
      sales: "Vendas",
      stock: "Estoque",
      viewer: "Consulta",
    }[role ?? ""] ?? role
  );
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: "center",
    borderBottomColor: "#e4e4e7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
  },
  actionRowArrow: {
    color: theme.colors.primary,
    fontSize: 26,
  },
  actionRowTitle: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  balanceValue: {
    color: theme.colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  cartRow: {
    alignItems: "center",
    borderBottomColor: "#e4e4e7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  compactButton: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: 48,
  },
  dangerText: {
    color: "#b91c1c",
  },
  disabled: {
    opacity: 0.5,
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 13,
    paddingVertical: theme.spacing.md,
    textAlign: "center",
  },
  errorText: {
    color: theme.colors.muted,
    textAlign: "center",
  },
  errorTitle: {
    color: theme.colors.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: theme.colors.foreground,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerIdentity: {
    flex: 1,
  },
  inlineError: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderColor: theme.colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: theme.colors.foreground,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  listMain: {
    flex: 1,
    gap: 3,
  },
  listMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  listRow: {
    alignItems: "center",
    borderBottomColor: "#e4e4e7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 62,
    paddingVertical: 8,
  },
  listRowSelected: {
    backgroundColor: "#f0fdf4",
  },
  listTitle: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  loadingText: {
    color: theme.colors.muted,
    fontWeight: "700",
  },
  metric: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    minWidth: "30%",
    padding: 12,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  metricValue: {
    color: theme.colors.foreground,
    fontSize: 24,
    fontWeight: "900",
  },
  metricWarning: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  notice: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 6,
    borderWidth: 1,
    color: "#166534",
    fontSize: 13,
    fontWeight: "800",
    padding: 12,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelBody: {
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  panelTitle: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: "900",
    padding: theme.spacing.md,
  },
  pressed: {
    opacity: 0.82,
  },
  price: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  productionAside: {
    alignItems: "flex-end",
    gap: 8,
  },
  productionRow: {
    alignItems: "center",
    borderBottomColor: "#e4e4e7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  role: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  section: {
    gap: theme.spacing.md,
  },
  segment: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  segmented: {
    borderColor: theme.colors.border,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  selectedLabel: {
    backgroundColor: "#f4f4f5",
    borderRadius: 6,
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: "700",
    padding: 12,
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  squareButton: {
    paddingHorizontal: 0,
    width: 34,
  },
  status: {
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
    color: theme.colors.foreground,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  stepperValue: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 24,
    textAlign: "center",
  },
  tab: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 3,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabs: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 20,
    fontWeight: "900",
  },
  totalLabel: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  totalRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  totalValue: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },
});
