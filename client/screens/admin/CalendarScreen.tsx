import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getBookings, getLocations, getClients } from "@/lib/storage";
import { Booking, Location, Client } from "@/types";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [bookingsData, locsData, clientsData] = await Promise.all([
      getBookings(),
      getLocations(),
      getClients(),
    ]);
    setBookings(bookingsData);
    setLocations(locsData);
    setClients(clientsData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
    };
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getBookingsForDate = () => {
    return bookings
      .filter(b => b.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Pobočka";
  };

  const getClientName = (userId: string) => {
    return clients.find(c => c.id === userId)?.name || "Klient";
  };

  const dayBookings = getBookingsForDate();
  const dates = getDates();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datesScroll}
          contentContainerStyle={styles.datesContent}
        >
          {dates.map(date => {
            const { day, date: dayNum } = formatDateShort(date);
            const hasBookings = bookings.some(b => b.date === date);
            const isSelected = date === selectedDate;
            const isToday = date === new Date().toISOString().split("T")[0];
            
            return (
              <Pressable
                key={date}
                onPress={() => {
                  setSelectedDate(date);
                  Haptics.selectionAsync();
                }}
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
                {hasBookings ? (
                  <View style={[styles.bookingDot, { backgroundColor: isSelected ? "#FFFFFF" : theme.primary }]} />
                ) : (
                  <View style={styles.bookingDotPlaceholder} />
                )}
                {isToday ? (
                  <ThemedText
                    type="small"
                    style={{ color: isSelected ? "#FFFFFF" : theme.primary, fontWeight: "600" }}
                  >
                    Dnes
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <ThemedText type="h3" style={styles.dateTitle}>
          {formatDateFull(selectedDate)}
        </ThemedText>

        {dayBookings.length > 0 ? (
          dayBookings.map(booking => (
            <Card key={booking.id} elevation={1} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={[styles.timeBadge, { backgroundColor: theme.primary }]}>
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {booking.time}
                  </ThemedText>
                </View>
                <View style={styles.bookingInfo}>
                  <ThemedText type="h4">{getClientName(booking.userId)}</ThemedText>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {getLocationName(booking.locationId)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card elevation={1} style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Feather name="calendar" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg, textAlign: "center" }}>
                Na tento den nemáte žádné rezervované tréninky
              </ThemedText>
            </View>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  datesScroll: {
    marginHorizontal: -Spacing.xl,
    marginBottom: Spacing.xl,
  },
  datesContent: {
    paddingHorizontal: Spacing.xl,
  },
  dateCard: {
    width: 70,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginRight: Spacing.md,
  },
  bookingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.xs,
  },
  bookingDotPlaceholder: {
    height: 6,
    marginTop: Spacing.xs,
  },
  dateTitle: {
    marginBottom: Spacing.lg,
  },
  bookingCard: {
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing["2xl"],
  },
  emptyContent: {
    alignItems: "center",
  },
});
