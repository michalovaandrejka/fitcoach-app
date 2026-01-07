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
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, register } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loginOrEmail, setLoginOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!loginOrEmail || !password) {
      Alert.alert("Chyba", "Vyplnte vsechna pole");
      return;
    }
    
    if (!isLogin && !name) {
      Alert.alert("Chyba", "Vyplnte jmeno");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(loginOrEmail, password);
      } else {
        await register(loginOrEmail, password, name);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Chyba", error.message || "Prihlaseni se nezdarilo");
    } finally {
      setIsLoading(false);
    }
  };

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
            placeholder={isLogin ? "Email nebo login" : "Email"}
            placeholderTextColor={theme.textSecondary}
            value={loginOrEmail}
            onChangeText={setLoginOrEmail}
            keyboardType={isLogin ? "default" : "email-address"}
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
            {isLogin ? "Nemate ucet? " : "Mate ucet? "}
            <ThemedText type="link">{isLogin ? "Registrovat" : "Prihlasit se"}</ThemedText>
          </ThemedText>
        </Pressable>

        {isLogin ? (
          <View style={styles.hint}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Trenerka: login "Andrea", heslo "Andrea"
            </ThemedText>
          </View>
        ) : null}
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
  hint: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
});
