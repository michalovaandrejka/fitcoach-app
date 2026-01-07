import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, register } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("CLIENT");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Chyba", "Vyplnte email a heslo");
      return;
    }
    
    if (!isLogin && !name) {
      Alert.alert("Chyba", "Vyplnte jmeno");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password, selectedRole);
      } else {
        await register(email, password, name);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Chyba", "Prihlaseni se nezdarilo");
    } finally {
      setIsLoading(false);
    }
  };

  const RoleButton = ({ role, label }: { role: UserRole; label: string }) => (
    <Pressable
      onPress={() => {
        setSelectedRole(role);
        Haptics.selectionAsync();
      }}
      style={[
        styles.roleButton,
        { 
          backgroundColor: selectedRole === role ? theme.primary : theme.backgroundSecondary,
          borderColor: selectedRole === role ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.roleButtonText,
          { color: selectedRole === role ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("@assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="h1" style={styles.title}>FitCoach</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isLogin ? "Prihlaste se do aplikace" : "Vytvorte si ucet"}
          </ThemedText>
        </View>

        {isLogin ? (
          <View style={styles.roleSelector}>
            <ThemedText type="small" style={[styles.roleLabel, { color: theme.textSecondary }]}>
              Prihlasit jako:
            </ThemedText>
            <View style={styles.roleButtons}>
              <RoleButton role="CLIENT" label="Klient" />
              <RoleButton role="ADMIN" label="Trenerka" />
            </View>
          </View>
        ) : null}

        <View style={styles.form}>
          {!isLogin ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Jmeno"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          ) : null}
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Heslo"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button onPress={handleSubmit} disabled={isLoading} style={{ backgroundColor: theme.primary }}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              isLogin ? "Prihlasit se" : "Registrovat"
            )}
          </Button>
        </View>

        <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {isLogin ? "Nemáte účet? " : "Máte účet? "}
            <ThemedText type="link">{isLogin ? "Registrovat" : "Prihlasit se"}</ThemedText>
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  roleSelector: {
    marginBottom: Spacing["2xl"],
  },
  roleLabel: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  roleButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  roleButtonText: {
    fontWeight: "600",
  },
  form: {
    gap: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  switchButton: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    padding: Spacing.md,
  },
});
