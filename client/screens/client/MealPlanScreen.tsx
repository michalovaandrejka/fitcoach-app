import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiGetMealPreference, apiUpdateMealPreference, apiGetMealPlan } from "@/lib/api";
import { MealPreference, TrainerMealPlan } from "@/types";

const GOALS = [
  { id: "weight_loss", label: "Hubnuti" },
  { id: "muscle", label: "Narust svalu" },
  { id: "fitness", label: "Kondice" },
];

type ViewMode = "mealplan" | "preferences";

export default function MealPlanScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  
  const [viewMode, setViewMode] = useState<ViewMode>("mealplan");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [trainerMealPlan, setTrainerMealPlan] = useState<TrainerMealPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    if (user) {
      setIsLoading(true);
      const [pref, mealPlan] = await Promise.all([
        apiGetMealPreference(user.id).catch(() => null),
        apiGetMealPlan(user.id).catch(() => null),
      ]);
      if (pref) {
        setLikes(pref.likes || "");
        setDislikes(pref.dislikes || "");
        setMealsPerDay(pref.mealsPerDay || 3);
        setSelectedGoals(pref.goals || []);
        setNotes(pref.notes || "");
      }
      setTrainerMealPlan(mealPlan);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    await apiUpdateMealPreference(user.id, {
      likes,
      dislikes,
      mealsPerDay,
      goals: selectedGoals,
      notes,
    });
    setIsSaving(false);
    setShowSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const toggleGoal = (goalId: string) => {
    Haptics.selectionAsync();
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setViewMode("mealplan")}
            style={[
              styles.toggleButton,
              { 
                backgroundColor: viewMode === "mealplan" ? theme.primary : "transparent",
                borderColor: viewMode === "mealplan" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather 
              name="file-text" 
              size={16} 
              color={viewMode === "mealplan" ? "#FFFFFF" : theme.text} 
              style={{ marginRight: Spacing.sm }}
            />
            <ThemedText
              type="small"
              style={{ color: viewMode === "mealplan" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
            >
              Jídelníček
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("preferences")}
            style={[
              styles.toggleButton,
              { 
                backgroundColor: viewMode === "preferences" ? theme.primary : "transparent",
                borderColor: viewMode === "preferences" ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather 
              name="settings" 
              size={16} 
              color={viewMode === "preferences" ? "#FFFFFF" : theme.text} 
              style={{ marginRight: Spacing.sm }}
            />
            <ThemedText
              type="small"
              style={{ color: viewMode === "preferences" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
            >
              Preference
            </ThemedText>
          </Pressable>
        </View>

        {viewMode === "mealplan" ? (
          <View style={styles.mealPlanSection}>
            {trainerMealPlan ? (
              <>
                <Card elevation={1} style={styles.card}>
                  <View style={styles.mealPlanHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="clipboard" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.mealPlanHeaderText}>
                      <ThemedText type="h4">Váš jídelníček</ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        od trenérky Andrey
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                <Card elevation={1} style={styles.card}>
                  <ThemedText type="body" style={styles.mealPlanContent}>
                    {trainerMealPlan.content}
                  </ThemedText>
                  <View style={[styles.updateInfo, { borderTopColor: theme.border }]}>
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      Aktualizovano: {formatDate(trainerMealPlan.updatedAt)}
                    </ThemedText>
                  </View>
                </Card>
              </>
            ) : (
              <Card elevation={1} style={styles.emptyCard}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "15" }]}>
                  <Feather name="clipboard" size={32} color={theme.primary} />
                </View>
                <ThemedText type="h4" style={styles.emptyTitle}>
                  Zatím žádný jídelníček
                </ThemedText>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Trenérka Andrea pro vás připravuje osobní jídelníček. Vyplňte prosím své preference, abychom věděli, co máte rádi.
                </ThemedText>
                <Pressable
                  onPress={() => setViewMode("preferences")}
                  style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Vyplnit preference
                  </ThemedText>
                </Pressable>
              </Card>
            )}
          </View>
        ) : (
          <View style={styles.preferencesSection}>
            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.fieldLabel}>Co mam rad/a</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Napr. kureci maso, ryze, zelenina..."
                placeholderTextColor={theme.textSecondary}
                value={likes}
                onChangeText={setLikes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onBlur={handleSave}
              />
            </Card>

            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.fieldLabel}>Co nesnasin</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Napr. ryby, mlecne vyrobky..."
                placeholderTextColor={theme.textSecondary}
                value={dislikes}
                onChangeText={setDislikes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onBlur={handleSave}
              />
            </Card>

            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.fieldLabel}>Kolikrat denne jim</ThemedText>
              <View style={styles.mealsSelector}>
                {[2, 3, 4, 5, 6].map(num => (
                  <Pressable
                    key={num}
                    onPress={() => {
                      setMealsPerDay(num);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.mealButton,
                      {
                        backgroundColor: mealsPerDay === num ? theme.primary : theme.backgroundSecondary,
                        borderColor: mealsPerDay === num ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: mealsPerDay === num ? "#FFFFFF" : theme.text, fontWeight: "600" }}
                    >
                      {num}x
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.fieldLabel}>Moje cile</ThemedText>
              <View style={styles.goalsContainer}>
                {GOALS.map(goal => (
                  <Pressable
                    key={goal.id}
                    onPress={() => toggleGoal(goal.id)}
                    style={[
                      styles.goalButton,
                      {
                        backgroundColor: selectedGoals.includes(goal.id) ? theme.primary + "15" : theme.backgroundSecondary,
                        borderColor: selectedGoals.includes(goal.id) ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        backgroundColor: selectedGoals.includes(goal.id) ? theme.primary : "transparent",
                        borderColor: selectedGoals.includes(goal.id) ? theme.primary : theme.textSecondary,
                      },
                    ]}>
                      {selectedGoals.includes(goal.id) ? (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <ThemedText type="body">{goal.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card elevation={1} style={styles.card}>
              <ThemedText type="h4" style={styles.fieldLabel}>Poznámky pro trenérku</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Napr. alergie, zdravotni omezeni..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onBlur={handleSave}
              />
            </Card>

            {showSaved ? (
              <View style={[styles.savedIndicator, { backgroundColor: theme.success }]}>
                <Feather name="check" size={16} color="#FFFFFF" />
                <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
                  Ulozeno
                </ThemedText>
              </View>
            ) : null}

            {isSaving ? (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                  Ukladam...
                </ThemedText>
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  viewToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  mealPlanSection: {
    gap: Spacing.md,
  },
  preferencesSection: {
    gap: Spacing.lg,
  },
  card: {
    marginBottom: 0,
  },
  mealPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  mealPlanHeaderText: {
    flex: 1,
  },
  mealPlanContent: {
    lineHeight: 24,
  },
  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  fieldLabel: {
    marginBottom: Spacing.md,
  },
  textArea: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  mealsSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  mealButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  goalsContainer: {
    gap: Spacing.sm,
  },
  goalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    gap: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  savedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
});
