import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getMealPreference, saveMealPreference } from "@/lib/storage";
import { MealPreference } from "@/types";

const GOALS = [
  { id: "weight_loss", label: "Hubnutí" },
  { id: "muscle", label: "Nárůst svalů" },
  { id: "fitness", label: "Kondice" },
];

export default function MealPlanScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
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
      const pref = await getMealPreference(user.id);
      if (pref) {
        setLikes(pref.likes);
        setDislikes(pref.dislikes);
        setMealsPerDay(pref.mealsPerDay);
        setSelectedGoals(pref.goals);
        setNotes(pref.notes);
      }
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    await saveMealPreference({
      userId: user.id,
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
          { paddingTop: Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        <Card elevation={1} style={styles.card}>
          <ThemedText type="h4" style={styles.fieldLabel}>Co mám rád/a</ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Např. kuřecí maso, rýže, zelenina..."
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
          <ThemedText type="h4" style={styles.fieldLabel}>Co nesnáším</ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Např. ryby, mléčné výrobky..."
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
          <ThemedText type="h4" style={styles.fieldLabel}>Kolikrát denně jím</ThemedText>
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
          <ThemedText type="h4" style={styles.fieldLabel}>Moje cíle</ThemedText>
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
            placeholder="Např. alergie, zdravotní omezení..."
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
              Uloženo
            </ThemedText>
          </View>
        ) : null}

        {isSaving ? (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
              Ukládám...
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
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
