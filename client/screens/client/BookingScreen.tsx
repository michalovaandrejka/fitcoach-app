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
import { getAvailability, getLocations, createBooking } from "@/lib/storage";
import { TimeSlot, Location } from "@/types";

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [avail, locs] = await Promise.all([getAvailability(), getLocations()]);
    setAvailability(avail);
    setLocations(locs);
    setIsLoading(false);
  };

  const getAvailableDates = () => {
    const dates = [...new Set(availability.filter(s => s.isAvailable).map(s => s.date))];
    return dates.sort().slice(0, 14);
  };

  const getTimeSlotsForDate = () => {
    if (!selectedDate || !selectedLocation) return [];
    return availability.filter(
      s => s.date === selectedDate && s.locationId === selectedLocation && s.isAvailable
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: date.getMonth() + 1,
    };
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedLocation || !user) {
      Alert.alert("Chyba", "Vyberte prosím datum, čas a pobočku");
      return;
    }

    setIsSubmitting(true);
    try {
      const location = locations.find(l => l.id === selectedLocation);
      await createBooking({
        userId: user.id,
        date: selectedDate,
        time: selectedTime,
        locationId: selectedLocation,
        locationName: location?.name || "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Úspěch", "Trénink byl úspěšně rezervován", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se vytvořit rezervaci");
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
          <ThemedText type="h4" style={styles.sectionTitle}>Vyberte pobočku</ThemedText>
          <View style={styles.locationGrid}>
            {locations.filter(l => l.isActive).map(location => (
              <Pressable
                key={location.id}
                onPress={() => {
                  setSelectedLocation(location.id);
                  setSelectedTime(null);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.locationCard,
                  {
                    backgroundColor: selectedLocation === location.id ? theme.primary + "15" : theme.backgroundSecondary,
                    borderColor: selectedLocation === location.id ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.locationHeader}>
                  <Feather
                    name="map-pin"
                    size={20}
                    color={selectedLocation === location.id ? theme.primary : theme.textSecondary}
                  />
                  {selectedLocation === location.id ? (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
                <ThemedText type="h4" style={styles.locationName}>{location.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{location.address}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Vyberte datum</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
            {availableDates.map(date => {
              const { day, date: dayNum, month } = formatDate(date);
              const hasSlots = selectedLocation
                ? availability.some(s => s.date === date && s.locationId === selectedLocation && s.isAvailable)
                : true;
              
              return (
                <Pressable
                  key={date}
                  onPress={() => {
                    if (hasSlots) {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      Haptics.selectionAsync();
                    }
                  }}
                  disabled={!hasSlots}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: selectedDate === date ? theme.primary : theme.backgroundSecondary,
                      opacity: hasSlots ? 1 : 0.4,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: selectedDate === date ? "#FFFFFF" : theme.textSecondary }}
                  >
                    {day}
                  </ThemedText>
                  <ThemedText
                    type="h3"
                    style={{ color: selectedDate === date ? "#FFFFFF" : theme.text }}
                  >
                    {dayNum}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: selectedDate === date ? "#FFFFFF" : theme.textSecondary }}
                  >
                    {month}.
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {selectedDate && selectedLocation ? (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>Vyberte čas</ThemedText>
            {timeSlots.length > 0 ? (
              <View style={styles.timesGrid}>
                {timeSlots.map(slot => (
                  <Pressable
                    key={slot.id}
                    onPress={() => {
                      setSelectedTime(slot.time);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: selectedTime === slot.time ? theme.primary : theme.backgroundSecondary,
                        borderColor: selectedTime === slot.time ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: selectedTime === slot.time ? "#FFFFFF" : theme.text,
                        fontWeight: selectedTime === slot.time ? "600" : "400",
                      }}
                    >
                      {slot.time}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Card elevation={1} style={styles.noSlotsCard}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Na tento den nejsou dostupné žádné volné termíny
                </ThemedText>
              </Card>
            )}
          </View>
        ) : null}

        <View style={styles.submitSection}>
          <Button
            onPress={handleSubmit}
            disabled={!selectedDate || !selectedTime || !selectedLocation || isSubmitting}
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
  sectionTitle: {
    marginBottom: Spacing.lg,
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  timeSlot: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  noSlotsCard: {
    padding: Spacing.xl,
  },
  submitSection: {
    marginTop: Spacing.lg,
  },
});
