import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getBookings, getMealPreference, getAdminNote, saveAdminNote, getLocations, getTrainerMealPlan, saveTrainerMealPlan } from "@/lib/storage";
import { Client, Booking, MealPreference, AdminNote, Location, TrainerMealPlan } from "@/types";

type TabType = "bookings" | "meal" | "notes";

const GOALS_MAP: Record<string, string> = {
  weight_loss: "Hubnuti",
  muscle: "Narust svalu",
  fitness: "Kondice",
};

export default function ClientDetailScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const client: Client = route.params?.client;
  
  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mealPref, setMealPref] = useState<MealPreference | null>(null);
  const [trainerMealPlan, setTrainerMealPlan] = useState<TrainerMealPlan | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [mealPlanText, setMealPlanText] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingMealPlan, setIsSavingMealPlan] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [client.id])
  );

  const loadData = async () => {
    setIsLoading(true);
    const [bookingsData, mealData, noteData, locsData, mealPlanData] = await Promise.all([
      getBookings(client.id),
      getMealPreference(client.id),
      getAdminNote(client.id),
      getLocations(),
      getTrainerMealPlan(client.id),
    ]);
    setBookings(bookingsData);
    setMealPref(mealData);
    setAdminNote(noteData?.note || "");
    setLocations(locsData);
    setTrainerMealPlan(mealPlanData);
    setMealPlanText(mealPlanData?.content || "");
    setIsLoading(false);
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    await saveAdminNote({
      userId: client.id,
      note: adminNote,
      updatedAt: new Date().toISOString(),
    });
    setIsSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveMealPlan = async () => {
    setIsSavingMealPlan(true);
    const now = new Date().toISOString();
    const plan: TrainerMealPlan = {
      id: trainerMealPlan?.id || `mealplan_${Date.now()}`,
      userId: client.id,
      content: mealPlanText,
      fileType: "text",
      createdAt: trainerMealPlan?.createdAt || now,
      updatedAt: now,
    };
    await saveTrainerMealPlan(plan);
    setTrainerMealPlan(plan);
    setIsSavingMealPlan(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Ulozeno", "Jidelnicek byl ulozen");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Pobocka";
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <Pressable
      onPress={() => {
        setActiveTab(tab);
        Haptics.selectionAsync();
      }}
      style={[
        styles.tabButton,
        { 
          backgroundColor: activeTab === tab ? theme.primary : "transparent",
          borderColor: activeTab === tab ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: activeTab === tab ? "#FFFFFF" : theme.text, fontWeight: "600" }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

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
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
              {client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </ThemedText>
          </View>
          <ThemedText type="h3" style={styles.clientName}>{client.name}</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>{client.email}</ThemedText>
        </View>

        <View style={styles.tabs}>
          <TabButton tab="bookings" label="Rezervace" />
          <TabButton tab="meal" label="Jidelnicek" />
          <TabButton tab="notes" label="Poznamky" />
        </View>

        {activeTab === "bookings" ? (
          <View style={styles.tabContent}>
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <Card key={booking.id} elevation={1} style={styles.bookingCard}>
                  <View style={styles.bookingRow}>
                    <View style={[styles.bookingIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="calendar" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.bookingInfo}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {formatDate(booking.date)} v {booking.time}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {getLocationName(booking.locationId)}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card elevation={1}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Klient nema zadne rezervace
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        {activeTab === "meal" ? (
          <View style={styles.tabContent}>
            <ThemedText type="h4" style={styles.sectionTitle}>Preference klienta</ThemedText>
            {mealPref ? (
              <>
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.success + "20" }]}>
                      <Feather name="heart" size={16} color={theme.success} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Ma rad/a</ThemedText>
                      <ThemedText type="body">{mealPref.likes || "Nevyplneno"}</ThemedText>
                    </View>
                  </View>
                </Card>
                
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.error + "20" }]}>
                      <Feather name="x-circle" size={16} color={theme.error} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Nesnasi</ThemedText>
                      <ThemedText type="body">{mealPref.dislikes || "Nevyplneno"}</ThemedText>
                    </View>
                  </View>
                </Card>
                
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="clock" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Jidel denne</ThemedText>
                      <ThemedText type="body">{mealPref.mealsPerDay}x</ThemedText>
                    </View>
                  </View>
                </Card>
                
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.warning + "20" }]}>
                      <Feather name="target" size={16} color={theme.warning} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Cile</ThemedText>
                      <ThemedText type="body">
                        {mealPref.goals.map(g => GOALS_MAP[g] || g).join(", ") || "Nevyplneno"}
                      </ThemedText>
                    </View>
                  </View>
                </Card>

                {mealPref.notes ? (
                  <Card elevation={1} style={styles.mealCard}>
                    <View style={styles.prefRow}>
                      <View style={[styles.prefIcon, { backgroundColor: theme.secondary + "20" }]}>
                        <Feather name="message-circle" size={16} color={theme.secondary} />
                      </View>
                      <View style={styles.prefContent}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>Poznamky klienta</ThemedText>
                        <ThemedText type="body">{mealPref.notes}</ThemedText>
                      </View>
                    </View>
                  </Card>
                ) : null}
              </>
            ) : (
              <Card elevation={1}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Klient nevyplnil preference
                </ThemedText>
              </Card>
            )}

            <View style={styles.divider} />

            <ThemedText type="h4" style={styles.sectionTitle}>Jidelnicek od trenerky</ThemedText>
            <Card elevation={1}>
              <TextInput
                style={[styles.mealPlanInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Napiste jidelnicek pro klienta..."
                placeholderTextColor={theme.textSecondary}
                value={mealPlanText}
                onChangeText={setMealPlanText}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleSaveMealPlan}
                disabled={isSavingMealPlan}
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
              >
                {isSavingMealPlan ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="save" size={18} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}>
                      Ulozit jidelnicek
                    </ThemedText>
                  </>
                )}
              </Pressable>
              {trainerMealPlan ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
                  Posledni uprava: {formatDate(trainerMealPlan.updatedAt)}
                </ThemedText>
              ) : null}
            </Card>
          </View>
        ) : null}

        {activeTab === "notes" ? (
          <View style={styles.tabContent}>
            <Card elevation={1}>
              <ThemedText type="h4" style={styles.noteLabel}>
                Interni poznamka (nevidi klient)
              </ThemedText>
              <TextInput
                style={[styles.noteInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Vase poznamky ke klientovi..."
                placeholderTextColor={theme.textSecondary}
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Pressable
                onPress={handleSaveNote}
                disabled={isSaving}
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="save" size={18} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}>
                      Ulozit poznamku
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </Card>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  clientName: {
    marginBottom: Spacing.xs,
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    borderWidth: 1,
  },
  tabContent: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: Spacing.lg,
  },
  bookingCard: {
    padding: Spacing.lg,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  mealCard: {
    padding: Spacing.lg,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  prefIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  prefContent: {
    flex: 1,
  },
  mealPlanInput: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 200,
    marginBottom: Spacing.lg,
  },
  noteLabel: {
    marginBottom: Spacing.md,
  },
  noteInput: {
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
