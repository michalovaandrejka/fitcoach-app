import React, { useCallback, useState } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getBookings, cancelBooking, getLocations } from "@/lib/storage";
import { Booking, Location } from "@/types";

export default function TrainingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (user) {
      const [bookingsData, locationsData] = await Promise.all([
        getBookings(user.id),
        getLocations(),
      ]);
      const sortedBookings = bookingsData.sort((a, b) => 
        new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
      );
      setBookings(sortedBookings);
      setLocations(locationsData);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      "Zrušit rezervaci",
      `Opravdu chcete zrušit trénink ${formatDate(booking.date)} v ${booking.time}?`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Ano, zrušit",
          style: "destructive",
          onPress: async () => {
            await cancelBooking(booking.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    const months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Pobočka";
  };

  const upcomingBookings = bookings.filter(b => new Date(`${b.date} ${b.time}`) >= new Date());

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card elevation={1} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.dateContainer}>
          <View style={[styles.dateBadge, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="calendar" size={16} color={theme.primary} />
          </View>
          <View>
            <ThemedText type="h4">{formatDate(item.date)}</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>{item.time}</ThemedText>
          </View>
        </View>
      </View>
      
      <View style={styles.locationRow}>
        <Feather name="map-pin" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
          {getLocationName(item.locationId)}
        </ThemedText>
      </View>

      <Pressable
        onPress={() => handleCancel(item)}
        style={[styles.cancelButton, { borderColor: theme.error }]}
      >
        <ThemedText type="small" style={{ color: theme.error }}>Zrušit rezervaci</ThemedText>
      </Pressable>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="calendar" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>Zatím nemáte žádné rezervace</ThemedText>
      <ThemedText type="body" style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Rezervujte si trénink v záložce Rezervace
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={upcomingBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Ahoj, {user?.name}
            </ThemedText>
            <ThemedText type="h2">Nadcházející tréninky</ThemedText>
          </View>
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing["2xl"],
  },
  bookingCard: {
    marginBottom: Spacing.lg,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dateBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: "center",
  },
});
