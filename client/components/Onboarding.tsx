import React, { useState, useRef } from "react";
import { StyleSheet, View, Pressable, Dimensions, ScrollView, FlatList, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MockElementType {
  type: "card" | "button" | "badge" | "icon";
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  color?: "primary" | "success" | "warning";
}

interface OnboardingStep {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  tip?: string;
  action?: string;
  mockElements?: MockElementType[];
}

const ADMIN_STEPS: OnboardingStep[] = [
  {
    icon: "home",
    title: "Dashboard",
    description: "Vas hlavni prehled s klicovymi statistikami a rychlymi akcemi.",
    tip: "Sledujte dnesni treninky a volne terminy na jednom miste",
    mockElements: [
      { type: "card", label: "12 klientu", icon: "users" },
      { type: "card", label: "3 dnesni treninky", icon: "calendar" },
      { type: "badge", label: "5 volnych terminu", color: "success" },
    ],
  },
  {
    icon: "calendar",
    title: "Kalendar treninku",
    description: "Vizualni prehled vsech naplanovanych treninku podle dne.",
    tip: "Kliknete na den pro zobrazeni detailu treninku",
    action: "Zkuste kliknout na kartu",
    mockElements: [
      { type: "card", label: "Pondeli - 3 treninky", icon: "calendar" },
      { type: "card", label: "Utery - 2 treninky", icon: "calendar" },
    ],
  },
  {
    icon: "clock",
    title: "Sprava dostupnosti",
    description: "Pridavejte volne terminy pro jednu nebo obe pobocky. Klienti si pak mohou rezervovat.",
    tip: "Volne terminy se automaticky skryji po rezervaci",
    action: "Tlacitko + prida novy termin",
    mockElements: [
      { type: "button", label: "+ Pridat termin", color: "primary" },
      { type: "badge", label: "10:00 - Volny", color: "success" },
      { type: "badge", label: "14:00 - Obsazeno", color: "warning" },
    ],
  },
  {
    icon: "users",
    title: "Sprava klientu",
    description: "Kompletni prehled vsech klientu s jejich rezervacemi a jidelnicky.",
    tip: "Kliknete na klienta pro detail a poznamky",
    mockElements: [
      { type: "card", label: "Jana Novakova", icon: "user" },
      { type: "card", label: "Petra Svobodova", icon: "user" },
    ],
  },
  {
    icon: "bell",
    title: "Notifikace",
    description: "Posilejte upozorneni klientum - vsem nebo jen vybranym.",
    tip: "Skvele pro oznameni zmeny terminu nebo akci",
    action: "Z dashboardu muzete odeslat notifikaci",
    mockElements: [
      { type: "button", label: "Odeslat notifikaci", color: "primary" },
    ],
  },
  {
    icon: "edit-3",
    title: "Manualni rezervace",
    description: "Blokujte terminy pro klienty z WhatsAppu nebo telefonu.",
    tip: "Kliknete na volny termin a vyberte 'Manualni rezervace'",
    mockElements: [
      { type: "badge", label: "Volny termin", color: "success" },
      { type: "icon", icon: "arrow-right" },
      { type: "badge", label: "Blokovano - Klient X", color: "warning" },
    ],
  },
];

const CLIENT_STEPS: OnboardingStep[] = [
  {
    icon: "calendar",
    title: "Vase treninky",
    description: "Prehled vsech vasich nadchazejicich treninku na jednom miste.",
    tip: "Treninky se radi podle data - nejblizsi nahore",
    mockElements: [
      { type: "card", label: "Pondeli 10:00", icon: "calendar" },
      { type: "card", label: "Streda 14:00", icon: "calendar" },
    ],
  },
  {
    icon: "plus-circle",
    title: "Rezervace treninku",
    description: "Jednoduse si zarezervujte novy trening v par krocich.",
    tip: "Vyberete datum, cas a pobocku",
    action: "Kliknete na + ve spodni liste",
    mockElements: [
      { type: "button", label: "1. Vyberte datum", color: "primary" },
      { type: "button", label: "2. Vyberte cas", color: "primary" },
      { type: "button", label: "3. Vyberte pobocku", color: "primary" },
    ],
  },
  {
    icon: "x-circle",
    title: "Zruseni treninku",
    description: "Pokud nemusite prijit, zruste trening vcas.",
    tip: "Rusit lze nejpozdeji 24 hodin predem",
    action: "Podrzeni prstu na treninku zobrazi moznosti",
    mockElements: [
      { type: "card", label: "Pondeli 10:00", icon: "calendar" },
      { type: "button", label: "Zrusit trening", color: "warning" },
    ],
  },
  {
    icon: "heart",
    title: "Vas jidelnicek",
    description: "Sdilte sve preference - co mate radi, co ne, a vase cile.",
    tip: "Trenerka vam muze pripravit individualni jidelnicek",
    mockElements: [
      { type: "badge", label: "Oblibene: Kure, ryze", color: "success" },
      { type: "badge", label: "Neoblibene: Ryby", color: "warning" },
    ],
  },
  {
    icon: "user",
    title: "Vas profil",
    description: "Upravte sve udaje, kontakt a nastaveni aplikace.",
    tip: "Zde se take muzete odhlasit",
    mockElements: [
      { type: "card", label: "Osobni udaje", icon: "edit" },
      { type: "card", label: "Nastaveni", icon: "settings" },
    ],
  },
];

interface OnboardingProps {
  isManual?: boolean;
  onComplete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MockElement({ 
  element, 
  index, 
  theme 
}: { 
  element: MockElementType; 
  index: number;
  theme: any;
}) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
  };

  const getColor = () => {
    switch (element.color) {
      case "success": return theme.success;
      case "warning": return theme.error;
      default: return theme.primary;
    }
  };

  if (element.type === "card") {
    return (
      <Animated.View 
        entering={FadeInDown.delay(300 + index * 150).springify()}
        style={animatedStyle}
      >
        <AnimatedPressable onPress={handlePress}>
          <Card elevation={1} style={styles.mockCard}>
            <View style={styles.mockCardContent}>
              {element.icon ? (
                <View style={[styles.mockIconBg, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name={element.icon} size={18} color={theme.primary} />
                </View>
              ) : null}
              <ThemedText type="body" style={{ flex: 1 }}>{element.label}</ThemedText>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </View>
          </Card>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (element.type === "button") {
    return (
      <Animated.View 
        entering={FadeInDown.delay(300 + index * 150).springify()}
        style={animatedStyle}
      >
        <AnimatedPressable 
          onPress={handlePress}
          style={[styles.mockButton, { backgroundColor: getColor() }]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {element.label}
          </ThemedText>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (element.type === "badge") {
    return (
      <Animated.View 
        entering={FadeInDown.delay(300 + index * 150).springify()}
        style={[styles.mockBadge, { backgroundColor: getColor() + "20" }, animatedStyle]}
      >
        <AnimatedPressable onPress={handlePress} style={styles.badgeInner}>
          <View style={[styles.statusDot, { backgroundColor: getColor() }]} />
          <ThemedText type="small" style={{ color: getColor(), fontWeight: "600" }}>
            {element.label}
          </ThemedText>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (element.type === "icon") {
    return (
      <Animated.View entering={FadeInDown.delay(300 + index * 150).springify()}>
        <Feather name={element.icon || "arrow-right"} size={24} color={theme.textSecondary} />
      </Animated.View>
    );
  }

  return null;
}

export function Onboarding({ isManual = false, onComplete }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const steps = user?.role === "ADMIN" ? ADMIN_STEPS : CLIENT_STEPS;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLastStep) {
      if (!isManual) {
        await completeOnboarding();
      }
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isManual) {
      await completeOnboarding();
    }
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentStep(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => {
    return (
      <View style={[styles.stepContainer, { width: SCREEN_WIDTH }]}>
        <View style={styles.stepContent}>
          <Animated.View 
            entering={FadeIn.delay(100)}
            style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}
          >
            <View style={[styles.iconInner, { backgroundColor: theme.primary + "25" }]}>
              <Feather name={item.icon} size={48} color={theme.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)}>
            <ThemedText type="h2" style={styles.stepTitle}>{item.title}</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)}>
            <ThemedText type="body" style={[styles.stepDescription, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          </Animated.View>

          {item.tip ? (
            <Animated.View 
              entering={FadeInUp.delay(400)}
              style={[styles.tipContainer, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "30" }]}
            >
              <Feather name="zap" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, flex: 1, marginLeft: Spacing.sm }}>
                {item.tip}
              </ThemedText>
            </Animated.View>
          ) : null}

          {item.mockElements && item.mockElements.length > 0 ? (
            <View style={styles.mockContainer}>
              {item.mockElements.map((el, idx) => (
                <MockElement key={idx} element={el} index={idx} theme={theme} />
              ))}
            </View>
          ) : null}

          {item.action ? (
            <Animated.View 
              entering={FadeInUp.delay(600)}
              style={styles.actionHint}
            >
              <View style={[styles.actionBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="mouse-pointer" size={14} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.xs }}>
                  {item.action}
                </ThemedText>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Krok {currentStep + 1} z {steps.length}
          </ThemedText>
          <ThemedText type="h3">
            {user?.role === "ADMIN" ? "Pruvodce pro trenerku" : "Pruvodce aplikaci"}
          </ThemedText>
        </View>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Preskocit</ThemedText>
          <Feather name="x" size={18} color={theme.textSecondary} style={{ marginLeft: Spacing.xs }} />
        </Pressable>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: theme.primary,
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }
          ]} 
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.navButtons}>
          {currentStep > 0 ? (
            <Pressable
              onPress={handlePrev}
              style={[styles.navButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="arrow-left" size={20} color={theme.text} />
            </Pressable>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}

          <View style={styles.dots}>
            {steps.map((_, index) => {
              const isActive = index === currentStep;
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCurrentStep(index);
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                  }}
                >
                  <Animated.View
                    style={[
                      styles.dot,
                      { 
                        backgroundColor: isActive ? theme.primary : theme.border,
                        width: isActive ? 24 : 8,
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleNext}
            style={[styles.navButton, { backgroundColor: theme.primary }]}
          >
            <Feather name={isLastStep ? "check" : "arrow-right"} size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.mainButton, { backgroundColor: theme.primary }]}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {isLastStep ? "Zacit pouzivat aplikaci" : "Pokracovat"}
          </ThemedText>
          <Feather 
            name={isLastStep ? "check-circle" : "arrow-right"} 
            size={20} 
            color="#FFFFFF" 
            style={{ marginLeft: Spacing.sm }} 
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E5E5",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  flatList: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  stepDescription: {
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  mockContainer: {
    marginTop: Spacing.xl,
    width: "100%",
    gap: Spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  mockCard: {
    minWidth: 160,
    marginBottom: 0,
  },
  mockCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mockIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  mockButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  mockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  actionHint: {
    marginTop: Spacing.xl,
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonPlaceholder: {
    width: 44,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
});
