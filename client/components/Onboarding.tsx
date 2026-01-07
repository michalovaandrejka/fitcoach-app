import React, { useState } from "react";
import { StyleSheet, View, Pressable, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingStep {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const ADMIN_STEPS: OnboardingStep[] = [
  {
    icon: "home",
    title: "Dashboard",
    description: "Na dashboardu vidite prehled klientu, dnesnich treninku a volnych terminu.",
  },
  {
    icon: "calendar",
    title: "Kalendar",
    description: "V kalendari vidite vsechny naplanovane treninky podle data.",
  },
  {
    icon: "clock",
    title: "Dostupnost",
    description: "V sekci Dostupnost pridavate volne terminy pro rezervaci. Muzete vybrat jednu nebo obe pobocky.",
  },
  {
    icon: "users",
    title: "Klienti",
    description: "Spravujte sve klienty, jejich rezervace a jidelnicky.",
  },
  {
    icon: "heart",
    title: "Jidelnicky",
    description: "U kazdeho klienta muzete videt jeho preference a pridat poznamky.",
  },
  {
    icon: "help-circle",
    title: "Tutorial",
    description: "Tento tutorial muzete znovu spustit tlacitkem na dashboardu.",
  },
];

const CLIENT_STEPS: OnboardingStep[] = [
  {
    icon: "calendar",
    title: "Vase treninky",
    description: "Na hlavni obrazovce vidite vsechny vase nadchazejici treninky.",
  },
  {
    icon: "plus-circle",
    title: "Rezervace treninku",
    description: "Kliknete na tlacitko + ve spodni liste pro rezervaci noveho treninku. Vyberete datum, cas a pobocku.",
  },
  {
    icon: "heart",
    title: "Jidelnicek",
    description: "V sekci Jidelnicek vyplnite sve preference - co mate radi, co ne, a vase cile.",
  },
  {
    icon: "user",
    title: "Profil",
    description: "V profilu muzete upravit sve udaje a odhlasit se.",
  },
];

interface OnboardingProps {
  isManual?: boolean;
  onComplete: () => void;
}

export function Onboarding({ isManual = false, onComplete }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = user?.role === "ADMIN" ? ADMIN_STEPS : CLIENT_STEPS;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      if (!isManual) {
        await completeOnboarding();
      }
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isManual) {
      await completeOnboarding();
    }
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <ThemedText type="h2">
          {user?.role === "ADMIN" ? "Vitejte, trenerko!" : "Vitejte v aplikaci!"}
        </ThemedText>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Preskocit</ThemedText>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={step.icon} size={64} color={theme.primary} />
        </View>
        
        <ThemedText type="h3" style={styles.stepTitle}>{step.title}</ThemedText>
        <ThemedText type="body" style={[styles.stepDescription, { color: theme.textSecondary }]}>
          {step.description}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentStep ? theme.primary : theme.border },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {isLastStep ? "Zacit" : "Dalsi"}
          </ThemedText>
          <Feather name={isLastStep ? "check" : "arrow-right"} size={20} color="#FFFFFF" style={{ marginLeft: Spacing.sm }} />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  skipButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  stepDescription: {
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
});
