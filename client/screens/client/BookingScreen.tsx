import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { getAvailableSlots, getLocations, createBooking } from "@/lib/storage";
import { Availability, Location } from "@/types";

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [avail, locs] = await Promise.all([getAvailableSlots(), getLocations()]);
    setAvailability(avail);
    setLocations(locs);
    setIsLoading(false);
  };

  const getAvailableDates = () => {
    const dates = [...new Set(availability.map(s => s.date))];
    return dates.sort();
  };

  const getTimeSlotsForDate = () => {
    if (!selectedDate) return [];
    return availability
      .filter(s => s.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getAllowedLocations = () => {
    if (!selectedSlot) return [];
    return locations.filter(l => selectedSlot.allowedLocationIds.includes(l.id) && l.isActive);
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

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedLocation(null);
    Haptics.selectionAsync();
  };

  const handleSelectSlot = (slot: Availability) => {
    setSelectedSlot(slot);
    setSelectedLocation(null);
    if (slot.allowedLocationIds.length === 1) {
      setSelectedLocation(slot.allowedLocationIds[0]);
    }
    Haptics.selectionAsync();
  };

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocation(locationId);
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedLocation || !user) {
      Alert.alert("Chyba", "Vyberte prosim datum, cas a pobocku");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking(user.id, selectedSlot.id, selectedLocation);
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

  const availableDates = getAvailableDates();
  const timeSlots = getTimeSlotsForDate();
  const allowedLocations = getAllowedLocations();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
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
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Zadne volne terminy
              </ThemedText>
            </Card>
          )}
        </View>

        {selectedDate ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>2. Vyberte cas</ThemedText>
            {timeSlots.length > 0 ? (
              <View style={styles.timesGrid}>
                {timeSlots.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const locationNames = slot.allowedLocationIds
                    .map(id => locations.find(l => l.id === id)?.name)
                    .filter(Boolean)
                    .join(", ");
                  
                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => handleSelectSlot(slot)}
                      style={[
                        styles.timeSlot,
                        {
                          backgroundColor: isSelected ? theme.primary + "15" : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="h4"
                        style={{ color: isSelected ? theme.primary : theme.text }}
                      >
                        {slot.time}
                      </ThemedText>
                      <View style={styles.slotLocationRow}>
                        <Feather name="map-pin" size={12} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                          {slot.allowedLocationIds.length === locations.length ? "Obe pobocky" : locationNames}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Card elevation={1} style={styles.emptyCard}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Na tento den nejsou dostupne zadne volne terminy
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        {selectedSlot && allowedLocations.length > 1 ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>3. Vyberte pobocku</ThemedText>
            <View style={styles.locationGrid}>
              {allowedLocations.map(location => {
                const isSelected = selectedLocation === location.id;
                
                return (
                  <Pressable
                    key={location.id}
                    onPress={() => handleSelectLocation(location.id)}
                    style={[
                      styles.locationCard,
                      {
                        backgroundColor: isSelected ? theme.primary + "15" : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.locationHeader}>
                      <Feather
                        name="map-pin"
                        size={20}
                        color={isSelected ? theme.primary : theme.textSecondary}
                      />
                      {isSelected ? (
                        <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                          <Feather name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                    <ThemedText type="h4" style={styles.locationName}>{location.name}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>{location.address}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedSlot ? (
          <View style={styles.summarySection}>
            <Card elevation={2} style={styles.summaryCard}>
              <ThemedText type="h4" style={styles.summaryTitle}>Shrnutí rezervace</ThemedText>
              <View style={styles.summaryRow}>
                <Feather name="calendar" size={18} color={theme.textSecondary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {formatDate(selectedSlot.date).day} {formatDate(selectedSlot.date).date}.{formatDate(selectedSlot.date).month}.
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="clock" size={18} color={theme.textSecondary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {selectedSlot.time}
                </ThemedText>
              </View>
              {selectedLocation ? (
                <View style={styles.summaryRow}>
                  <Feather name="map-pin" size={18} color={theme.textSecondary} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                    {locations.find(l => l.id === selectedLocation)?.name}
                  </ThemedText>
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        <View style={styles.submitSection}>
          <Button
            onPress={handleSubmit}
            disabled={!selectedSlot || !selectedLocation || isSubmitting}
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
  sectionTitle: {
    marginBottom: Spacing.lg,
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
  },
  slotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  locationGrid: {
    gap: Spacing.md,
  },
  locationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  locationName: {
    marginBottom: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing.xl,
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
