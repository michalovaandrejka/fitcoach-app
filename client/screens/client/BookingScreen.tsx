import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAvailableStartTimes, getAvailabilityBlocks, createBooking } from "@/lib/storage";
import { AvailableSlot, TRAINING_DURATION } from "@/types";

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    setIsLoading(true);
    const blocks = await getAvailabilityBlocks();
    const today = new Date().toISOString().split("T")[0];
    const futureDates = [...new Set(blocks.filter(b => b.date >= today).map(b => b.date))].sort();
    setAvailableDates(futureDates);
    setIsLoading(false);
  };

  const loadSlotsForDate = async (date: string) => {
    setIsLoadingSlots(true);
    const slots = await getAvailableStartTimes(date);
    setAvailableSlots(slots);
    setIsLoadingSlots(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Ne", "Po", "Ut", "St", "Ct", "Pa", "So"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: date.getMonth() + 1,
    };
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Nedele", "Pondeli", "Utery", "Streda", "Ctvrtek", "Patek", "Sobota"];
    const months = ["ledna", "unora", "brezna", "dubna", "kvetna", "cervna", "cervence", "srpna", "zari", "rijna", "listopadu", "prosince"];
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    Haptics.selectionAsync();
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate || !user) {
      Alert.alert("Chyba", "Vyberte prosim datum a cas treninku");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking(
        user.id,
        user.name,
        selectedDate,
        selectedSlot.startTime,
        selectedSlot.branchId
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Uspech", "Trenink byl uspesne rezervovan", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se vytvorit rezervaci");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const key = slot.startTime;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, AvailableSlot[]>);

  const sortedTimes = Object.keys(groupedSlots).sort();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>1. Vyberte datum</ThemedText>
          {availableDates.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
              {availableDates.map(date => {
                const { day, date: dayNum, month } = formatDate(date);
                const isSelected = selectedDate === date;
                
                return (
                  <Pressable
                    key={date}
                    onPress={() => handleSelectDate(date)}
                    style={[
                      styles.dateCard,
                      { backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary }}
                    >
                      {day}
                    </ThemedText>
                    <ThemedText
                      type="h3"
                      style={{ color: isSelected ? "#FFFFFF" : theme.text }}
                    >
                      {dayNum}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary }}
                    >
                      {month}.
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Card elevation={1} style={styles.emptyCard}>
              <Feather name="calendar" size={32} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Zadne volne terminy
              </ThemedText>
            </Card>
          )}
        </View>

        {selectedDate ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">2. Vyberte cas treninku</ThemedText>
              <View style={[styles.durationBadge, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="clock" size={12} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.primary, marginLeft: 4 }}>
                  {TRAINING_DURATION} min
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              {formatDateFull(selectedDate)}
            </ThemedText>
            
            {isLoadingSlots ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: Spacing.xl }} />
            ) : sortedTimes.length > 0 ? (
              <View style={styles.timesGrid}>
                {sortedTimes.map(time => {
                  const slotsAtTime = groupedSlots[time];
                  
                  return slotsAtTime.map(slot => {
                    const isSelected = selectedSlot?.startTime === slot.startTime && 
                                      selectedSlot?.branchId === slot.branchId;
                    
                    return (
                      <Pressable
                        key={`${slot.startTime}_${slot.branchId}`}
                        onPress={() => handleSelectSlot(slot)}
                        style={[
                          styles.timeSlot,
                          {
                            backgroundColor: isSelected ? theme.primary + "15" : theme.backgroundSecondary,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <View style={styles.slotTimeRow}>
                          <ThemedText
                            type="h4"
                            style={{ color: isSelected ? theme.primary : theme.text }}
                          >
                            {slot.startTime}
                          </ThemedText>
                          <ThemedText
                            type="small"
                            style={{ color: theme.textSecondary }}
                          >
                            - {slot.endTime}
                          </ThemedText>
                        </View>
                        <View style={styles.slotLocationRow}>
                          <Feather name="map-pin" size={12} color={isSelected ? theme.primary : theme.textSecondary} />
                          <ThemedText type="small" style={{ color: isSelected ? theme.primary : theme.textSecondary, marginLeft: 4 }}>
                            {slot.branchName}
                          </ThemedText>
                        </View>
                        {isSelected ? (
                          <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                            <Feather name="check" size={12} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  });
                })}
              </View>
            ) : (
              <Card elevation={1} style={styles.emptyCard}>
                <Feather name="clock" size={32} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Na tento den nejsou dostupne zadne volne casy
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        {selectedSlot && selectedDate ? (
          <View style={styles.summarySection}>
            <Card elevation={2} style={styles.summaryCard}>
              <ThemedText type="h4" style={styles.summaryTitle}>Shrnutí rezervace</ThemedText>
              <View style={styles.summaryRow}>
                <Feather name="calendar" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {formatDateFull(selectedDate)}
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {selectedSlot.startTime} - {selectedSlot.endTime} ({TRAINING_DURATION} min)
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="map-pin" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {selectedSlot.branchName}
                </ThemedText>
              </View>
            </Card>
          </View>
        ) : null}

        <View style={styles.submitSection}>
          <Button
            onPress={handleSubmit}
            disabled={!selectedSlot || !selectedDate || isSubmitting}
            style={{ backgroundColor: theme.primary }}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : "Rezervovat trenink"}
          </Button>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  datesScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  dateCard: {
    width: 70,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginRight: Spacing.md,
  },
  timesGrid: {
    gap: Spacing.md,
  },
  timeSlot: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    position: "relative",
  },
  slotTimeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  slotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  selectedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  summarySection: {
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryTitle: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  submitSection: {
    marginTop: Spacing.lg,
  },
});
