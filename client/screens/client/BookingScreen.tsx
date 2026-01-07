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
import { apiGetLocations, apiGetAvailableDates, apiGetAvailableSlots, apiCreateBooking } from "@/lib/api";
import { Location, AvailableSlot, TRAINING_DURATION } from "@/types";

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadDatesForLocation(selectedLocation.id);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedDate && selectedLocation) {
      loadSlotsForDate(selectedDate, selectedLocation.id);
    }
  }, [selectedDate, selectedLocation]);

  const loadLocations = async () => {
    setIsLoading(true);
    const locs = await apiGetLocations();
    setLocations(locs.filter(l => l.isActive));
    setIsLoading(false);
  };

  const loadDatesForLocation = async (branchId: string) => {
    setIsLoadingDates(true);
    const dates = await apiGetAvailableDates(branchId);
    setAvailableDates(dates);
    setIsLoadingDates(false);
  };

  const loadSlotsForDate = async (date: string, branchId: string) => {
    setIsLoadingSlots(true);
    const slots = await apiGetAvailableSlots(date, branchId);
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

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableDates([]);
    setAvailableSlots([]);
    Haptics.selectionAsync();
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
    if (!selectedSlot || !selectedDate || !user || !selectedLocation) {
      Alert.alert("Chyba", "Vyberte prosím fitko, datum a čas tréninku");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateBooking(
        selectedDate,
        selectedSlot.startTime,
        selectedLocation.id,
        selectedLocation.name
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Úspěch", "Trénink byl úspěšně rezervován", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodařilo se vytvořit rezervaci");
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
          <ThemedText type="h4" style={styles.sectionTitle}>1. Vyberte fitko</ThemedText>
          {locations.length > 0 ? (
            <View style={styles.locationsGrid}>
              {locations.map(location => {
                const isSelected = selectedLocation?.id === location.id;
                
                return (
                  <Pressable
                    key={location.id}
                    onPress={() => handleSelectLocation(location)}
                    style={[
                      styles.locationCard,
                      {
                        backgroundColor: isSelected ? theme.primary + "15" : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.locationIcon}>
                      <Feather 
                        name="map-pin" 
                        size={24} 
                        color={isSelected ? theme.primary : theme.textSecondary} 
                      />
                    </View>
                    <ThemedText
                      type="h4"
                      style={{ color: isSelected ? theme.primary : theme.text, marginBottom: Spacing.xs }}
                    >
                      {location.name}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, textAlign: "center" }}
                    >
                      {location.address}
                    </ThemedText>
                    {isSelected ? (
                      <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Card elevation={1} style={styles.emptyCard}>
              <Feather name="map-pin" size={32} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Žádná aktivní fitka
              </ThemedText>
            </Card>
          )}
        </View>

        {selectedLocation ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>2. Vyberte datum</ThemedText>
            {isLoadingDates ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: Spacing.xl }} />
            ) : availableDates.length > 0 ? (
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
                  Žádné volné termíny v {selectedLocation.name}
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        {selectedDate && selectedLocation ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">3. Vyberte čas tréninku</ThemedText>
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
            ) : availableSlots.length > 0 ? (
              <View style={styles.timesGrid}>
                {availableSlots.map(slot => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  
                  return (
                    <Pressable
                      key={`${slot.startTime}`}
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
                      {isSelected ? (
                        <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                          <Feather name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Card elevation={1} style={styles.emptyCard}>
                <Feather name="clock" size={32} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Na tento den nejsou dostupné žádné volné časy
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        {selectedSlot && selectedDate && selectedLocation ? (
          <View style={styles.summarySection}>
            <Card elevation={2} style={styles.summaryCard}>
              <ThemedText type="h4" style={styles.summaryTitle}>Shrnutí rezervace</ThemedText>
              <View style={styles.summaryRow}>
                <Feather name="map-pin" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {selectedLocation.name}
                </ThemedText>
              </View>
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
            </Card>
          </View>
        ) : null}

        <View style={styles.submitSection}>
          <Button
            onPress={handleSubmit}
            disabled={!selectedSlot || !selectedDate || !selectedLocation || isSubmitting}
            style={{ backgroundColor: theme.primary }}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : "Rezervovat trénink"}
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
  locationsGrid: {
    gap: Spacing.md,
  },
  locationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  locationIcon: {
    marginBottom: Spacing.md,
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
