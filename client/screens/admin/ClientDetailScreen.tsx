import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiGetBookings, apiGetMealPreference, apiGetAdminNote, apiUpdateAdminNote, apiGetLocations, apiGetMealPlan, apiUpdateMealPlan, apiDeleteBooking, apiDeleteUser } from "@/lib/api";
import { Client, Booking, MealPreference, AdminNote, Location, TrainerMealPlan } from "@/types";

type TabType = "bookings" | "meal" | "notes";

const GOALS_MAP: Record<string, string> = {
  weight_loss: "Hubnutí",
  muscle: "Nárůst svalů",
  fitness: "Kondice",
};

export default function ClientDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
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
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [client.id])
  );

  const loadData = async () => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [bookingsData, mealData, noteData, locsData, mealPlanData] = await Promise.all([
      apiGetBookings(undefined, client.id),
      apiGetMealPreference(client.id).catch(() => null),
      apiGetAdminNote(client.id).catch(() => ({ note: "" })),
      apiGetLocations(),
      apiGetMealPlan(client.id).catch(() => null),
    ]);
    setBookings(bookingsData);
    const futureData = bookingsData.filter(b => b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    setFutureBookings(futureData);
    setMealPref(mealData);
    setAdminNote(noteData?.note || "");
    setLocations(locsData);
    setTrainerMealPlan(mealPlanData);
    setMealPlanText(mealPlanData?.content || "");
    setIsLoading(false);
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    await apiUpdateAdminNote(client.id, { note: adminNote });
    setIsSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveMealPlan = async () => {
    setIsSavingMealPlan(true);
    const result = await apiUpdateMealPlan(client.id, { content: mealPlanText, fileType: "text" });
    setTrainerMealPlan(result);
    setIsSavingMealPlan(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Uloženo", "Jídelníček byl uložen");
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      "Zrušit trénink",
      `Opravdu chcete zrušit trénink ${formatDate(booking.date)} v ${booking.startTime}?`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Ano, zrušit",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteBooking(booking.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Zrušeno", "Trénink byl zrušen a termín je znovu volný.");
              loadData();
            } catch (error) {
              Alert.alert("Chyba", "Nepodařilo se zrušit trénink");
            }
          },
        },
      ]
    );
  };

  const handleDeleteClient = () => {
    Alert.alert(
      "Smazat klienta",
      "Opravdu chcete smazat tohoto klienta? Tato akce je nevratná.",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Ano, smazat",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteUser(client.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Chyba", "Nepodařilo se smazat klienta");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Pobočka";
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
          <TabButton tab="meal" label="Jídelníček" />
          <TabButton tab="notes" label="Poznámky" />
        </View>

        {activeTab === "bookings" ? (
          <View style={styles.tabContent}>
            {futureBookings.length > 0 ? (
              <>
                <ThemedText type="h4" style={styles.sectionTitle}>Nadcházející tréninky</ThemedText>
                {futureBookings.map(booking => (
                  <Card key={booking.id} elevation={1} style={styles.bookingCard}>
                    <View style={styles.bookingRow}>
                      <View style={[styles.bookingIcon, { backgroundColor: theme.primary + "20" }]}>
                        <Feather name="calendar" size={16} color={theme.primary} />
                      </View>
                      <View style={styles.bookingInfo}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          {formatDate(booking.date)} v {booking.startTime}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {booking.branchName || getLocationName(booking.branchId)}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => handleCancelBooking(booking)}
                        style={[styles.cancelButton, { backgroundColor: theme.error + "20" }]}
                      >
                        <Feather name="x" size={16} color={theme.error} />
                        <ThemedText type="small" style={{ color: theme.error, marginLeft: Spacing.xs }}>
                          Zrušit
                        </ThemedText>
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </>
            ) : (
              <Card elevation={1}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Klient nemá žádné nadcházející tréninky
                </ThemedText>
              </Card>
            )}

            {bookings.length > futureBookings.length ? (
              <>
                <View style={styles.divider} />
                <ThemedText type="h4" style={styles.sectionTitle}>Historie rezervací</ThemedText>
                {bookings.filter(b => !futureBookings.find(fb => fb.id === b.id)).map(booking => (
                  <Card key={booking.id} elevation={1} style={styles.bookingCard}>
                    <View style={styles.bookingRow}>
                      <View style={[styles.bookingIcon, { backgroundColor: theme.textSecondary + "20" }]}>
                        <Feather name="check" size={16} color={theme.textSecondary} />
                      </View>
                      <View style={styles.bookingInfo}>
                        <ThemedText type="body" style={{ fontWeight: "600", color: theme.textSecondary }}>
                          {formatDate(booking.date)} v {booking.startTime}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {booking.branchName || getLocationName(booking.branchId)}
                        </ThemedText>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            ) : null}
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
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Má rád/a</ThemedText>
                      <ThemedText type="body">{mealPref.likes || "Nevyplněno"}</ThemedText>
                    </View>
                  </View>
                </Card>
                
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.error + "20" }]}>
                      <Feather name="x-circle" size={16} color={theme.error} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Nesnáší</ThemedText>
                      <ThemedText type="body">{mealPref.dislikes || "Nevyplněno"}</ThemedText>
                    </View>
                  </View>
                </Card>
                
                <Card elevation={1} style={styles.mealCard}>
                  <View style={styles.prefRow}>
                    <View style={[styles.prefIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather name="clock" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.prefContent}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Jídel denně</ThemedText>
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
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Cíle</ThemedText>
                      <ThemedText type="body">
                        {Array.isArray(mealPref.goals) && mealPref.goals.length > 0
                          ? mealPref.goals.map(g => GOALS_MAP[g] || g).join(", ")
                          : "Nevyplněno"}
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
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>Poznámky klienta</ThemedText>
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

            <ThemedText type="h4" style={styles.sectionTitle}>Jídelníček od trenérky</ThemedText>
            <Card elevation={1}>
              <TextInput
                style={[styles.mealPlanInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Napište jídelníček pro klienta..."
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
                      Uložit jídelníček
                    </ThemedText>
                  </>
                )}
              </Pressable>
              {trainerMealPlan ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
                  Poslední úprava: {formatDate(trainerMealPlan.updatedAt)}
                </ThemedText>
              ) : null}
            </Card>
          </View>
        ) : null}

        {activeTab === "notes" ? (
          <View style={styles.tabContent}>
            <Card elevation={1}>
              <ThemedText type="h4" style={styles.noteLabel}>
                Interní poznámka (nevidí klient)
              </ThemedText>
              <TextInput
                style={[styles.noteInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Vaše poznámky ke klientovi..."
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
                      Uložit poznámku
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </Card>
          </View>
        ) : null}

        <View style={styles.dangerZone}>
          <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.error }]}>Nebezpečná zóna</ThemedText>
          <Pressable
            onPress={handleDeleteClient}
            style={[styles.deleteButton, { borderColor: theme.error }]}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
            <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
              Smazat klienta
            </ThemedText>
          </Pressable>
        </View>
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
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  dangerZone: {
    marginTop: Spacing["3xl"],
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
