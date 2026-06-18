import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { appConfig } from "@/core/config/app-config";
import { container } from "@/core/infrastructure/di/container";
import { TOKENS } from "@/core/infrastructure/di/tokens";
import { theme } from "@/core/theme/theme";
import { AuthRepository } from "@/features/auth/domain/auth";
import { useAuthStore } from "@/features/auth/presentation/stores/useAuthStore";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const login = useMutation({
    mutationFn: () =>
      container
        .get<AuthRepository>(TOKENS.authRepository)
        .login(email.trim(), password),
    onSuccess: setSession,
  });
  const canSubmit = email.trim().length > 3 && password.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>PB</Text>
        </View>
        <View>
          <Text style={styles.eyebrow}>PaoBom ERP</Text>
          <Text style={styles.title}>Operacao mobile</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="usuario@paobom.local"
            style={styles.input}
            value={email}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Sua senha"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {login.error ? (
          <Text style={styles.error}>{login.error.message}</Text>
        ) : null}

        <Pressable
          disabled={!canSubmit || login.isPending}
          onPress={() => login.mutate()}
          style={({ pressed }) => [
            styles.submit,
            pressed ? styles.pressed : null,
            !canSubmit || login.isPending ? styles.disabled : null,
          ]}
        >
          {login.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Entrar</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.endpoint}>Servidor: {appConfig.apiBaseUrl}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  endpoint: {
    color: theme.colors.muted,
    fontSize: 11,
    textAlign: "center",
  },
  error: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 6,
    borderWidth: 1,
    color: "#991b1b",
    fontSize: 13,
    padding: 12,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  field: {
    gap: 6,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: theme.colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: theme.colors.foreground,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  label: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
  },
  screen: {
    flex: 1,
    gap: theme.spacing.xl,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  submit: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 48,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 25,
    fontWeight: "900",
  },
});
