import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator } from "react-native";
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
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");
    
    if (!loginOrEmail || !password) {
      setErrorMessage("Vyplňte všechna pole");
      return;
    }
    
    if (!isLogin && !name) {
      setErrorMessage("Vyplňte jméno");
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
      setErrorMessage(error.message || "Přihlášení se nezdařilo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.photoContainer, { borderColor: theme.primary }]}>
            <Image
              source={require("@assets/generated_images/fitness_trainer_professional_portrait.png")}
              style={styles.photo}
              contentFit="cover"
            />
          </View>
          <ThemedText type="h2" style={styles.trainerName}>Andrea Michalová</ThemedText>
          <ThemedText type="body" style={[styles.trainerTitle, { color: theme.primary }]}>
            fitness trenérka
          </ThemedText>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <ThemedText type="h4" style={styles.formTitle}>
          {isLogin ? "Přihlášení" : "Registrace"}
        </ThemedText>

        {errorMessage ? (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + "20", borderColor: theme.error }]}>
            <ThemedText type="body" style={{ color: theme.error }}>{errorMessage}</ThemedText>
          </View>
        ) : null}

        <View style={styles.form}>
          {!isLogin ? (
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Jméno"
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
              isLogin ? "Přihlásit se" : "Registrovat"
            )}
          </Button>
        </View>

        <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {isLogin ? "Nemáte účet? " : "Máte účet? "}
            <ThemedText type="link">{isLogin ? "Registrovat" : "Přihlásit se"}</ThemedText>
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
    marginBottom: Spacing["2xl"],
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  trainerName: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  trainerTitle: {
    textAlign: "center",
    fontWeight: "500",
  },
  divider: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  dividerLine: {
    width: 60,
    height: 2,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
    borderWidth: 1,
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
