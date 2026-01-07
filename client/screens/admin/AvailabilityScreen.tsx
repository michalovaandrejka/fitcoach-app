import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable, RefreshControl, Alert, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAvailability, getLocations, addAvailability, deleteAvailability, createManualBooking, releaseManualBooking, getBookings, cancelBooking } from "@/lib/storage";
import { Availability, Location, Booking } from "@/types";
import { TextInput } from "react-native";

const TIME_OPTIONS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [slots, setSlots] = useState<Availability[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("09:00");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSlotForManual, setSelectedSlotForManual] = useState<Availability | null>(null);
  const [manualClientName, setManualClientName] = useState("");

  const loadData = async () => {
    const [slotsData, locsData, bookingsData] = await Promise.all([
      getAvailability(),
      getLocations(),
      getBookings(),
    ]);
    setSlots(slotsData);
    setLocations(locsData);
    setBookings(bookingsData);
    if (locsData.length > 0 && selectedLocationIds.length === 0) {
      setSelectedLocationIds(locsData.map(l => l.id));
    }
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
    const days = ["Ne", "Po", "Ut", "St", "Ct", "Pa", "So"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
    };
  };

  const getSlotsForDate = () => {
    return slots
      .filter(s => s.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => locations.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const handleToggleLocation = (locationId: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter(id => id !== locationId);
      }
      return [...prev, locationId];
    });
    Haptics.selectionAsync();
  };

  const handleSelectAll = () => {
    setSelectedLocationIds(locations.map(l => l.id));
    Haptics.selectionAsync();
  };

  const handleAddSlot = async () => {
    if (selectedLocationIds.length === 0) {
      Alert.alert("Chyba", "Vyberte alespon jednu pobocku");
      return;
    }

    try {
      await addAvailability(selectedDate, newSlotTime, selectedLocationIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se pridat termin");
    }
  };

  const handleDeleteSlot = async (slot: Availability) => {
    if (slot.isBooked) {
      Alert.alert("Nelze smazat", "Tento termin je jiz rezervovan");
      return;
    }

    Alert.alert(
      "Smazat termin",
      `Opravdu chcete smazat termin ${slot.time}?`,
      [
        { text: "Zrusit", style: "cancel" },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAvailability(slot.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se smazat termin");
            }
          },
        },
      ]
    );
  };

  const handleSlotPress = (slot: Availability) => {
    if (!slot.isBooked) {
      setSelectedSlotForManual(slot);
      setManualClientName("");
      setShowManualModal(true);
      Haptics.selectionAsync();
    } else if (slot.bookingType === "manual") {
      Alert.alert(
        "Uvolnit termin",
        `Opravdu chcete uvolnit termin ${slot.time}?\n\nRezervovano pro: ${slot.manualClientName}`,
        [
          { text: "Zrusit", style: "cancel" },
          {
            text: "Uvolnit",
            style: "destructive",
            onPress: async () => {
              try {
                await releaseManualBooking(slot.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                loadData();
              } catch (error) {
                Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se uvolnit termin");
              }
            },
          },
        ]
      );
    } else {
      const booking = bookings.find(b => b.availabilityId === slot.id);
      if (booking) {
        Alert.alert(
          "Zrusit rezervaci",
          `Termin ${slot.time} je rezervovan z aplikace.\n\nChcete rezervaci zrusit?`,
          [
            { text: "Ne", style: "cancel" },
            {
              text: "Zrusit rezervaci",
              style: "destructive",
              onPress: async () => {
                try {
                  await cancelBooking(booking.id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  loadData();
                } catch (error) {
                  Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se zrusit rezervaci");
                }
              },
            },
          ]
        );
      }
    }
  };

  const handleManualBooking = async () => {
    if (!selectedSlotForManual) return;
    
    if (!manualClientName.trim()) {
      Alert.alert("Chyba", "Zadejte jmeno klienta");
      return;
    }

    try {
      await createManualBooking(selectedSlotForManual.id, manualClientName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowManualModal(false);
      setSelectedSlotForManual(null);
      setManualClientName("");
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se vytvorit rezervaci");
    }
  };

  const getBookingInfo = (slot: Availability): string | null => {
    if (!slot.isBooked) return null;
    
    if (slot.bookingType === "manual" && slot.manualClientName) {
      return `Rezervovano: ${slot.manualClientName} (manualne)`;
    }
    
    const booking = bookings.find(b => b.availabilityId === slot.id);
    if (booking) {
      return `Rezervovano: ${booking.locationName}`;
    }
    
    return "Obsazeno";
  };

  const daySlots = getSlotsForDate();
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
            const isSelected = date === selectedDate;
            
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
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.headerRow}>
          <ThemedText type="h4">Terminy</ThemedText>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {daySlots.length > 0 ? (
          daySlots.map(slot => {
            const bookingInfo = getBookingInfo(slot);
            return (
              <Card key={slot.id} elevation={1} style={styles.slotCard} onPress={() => handleSlotPress(slot)}>
                <View style={styles.slotContent}>
                  <View style={styles.slotInfo}>
                    <ThemedText type="h4">{slot.time}</ThemedText>
                    <View style={styles.locationRow}>
                      <Feather name="map-pin" size={14} color={theme.textSecondary} />
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                        {getLocationNames(slot.allowedLocationIds)}
                      </ThemedText>
                    </View>
                    {bookingInfo ? (
                      <ThemedText type="small" style={{ color: theme.primary, marginTop: Spacing.xs }}>
                        {bookingInfo}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.slotActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: slot.isBooked ? theme.error + "20" : theme.success + "20" },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: slot.isBooked ? theme.error : theme.success },
                        ]}
                      />
                      <ThemedText
                        type="small"
                        style={{ color: slot.isBooked ? theme.error : theme.success, fontWeight: "600" }}
                      >
                        {slot.isBooked ? "Obsazeno" : "Volny"}
                      </ThemedText>
                    </View>
                    {!slot.isBooked ? (
                      <Pressable
                        onPress={() => handleDeleteSlot(slot)}
                        style={[styles.deleteButton, { backgroundColor: theme.error + "20" }]}
                      >
                        <Feather name="trash-2" size={16} color={theme.error} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card elevation={1} style={styles.emptyCard}>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Na tento den nejsou nastaveny zadne terminy
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Pridat termin</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="h4" style={styles.modalLabel}>Cas</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {TIME_OPTIONS.map(time => (
                <Pressable
                  key={time}
                  onPress={() => {
                    setNewSlotTime(time);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.timeOption,
                    { backgroundColor: newSlotTime === time ? theme.primary : theme.backgroundSecondary },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{ color: newSlotTime === time ? "#FFFFFF" : theme.text }}
                  >
                    {time}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.locationHeader}>
              <ThemedText type="h4">Pobocky</ThemedText>
              <Pressable onPress={handleSelectAll}>
                <ThemedText type="small" style={{ color: theme.primary }}>
                  Vybrat vse
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.locationsContainer}>
              {locations.map(loc => {
                const isSelected = selectedLocationIds.includes(loc.id);
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => handleToggleLocation(loc.id)}
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: isSelected ? theme.primary + "20" : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={[styles.checkbox, { borderColor: isSelected ? theme.primary : theme.border }]}>
                      {isSelected ? (
                        <Feather name="check" size={14} color={theme.primary} />
                      ) : null}
                    </View>
                    <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                      {loc.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <Button onPress={handleAddSlot} style={{ backgroundColor: theme.primary, marginTop: Spacing.xl }}>
              Pridat termin
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={showManualModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Manualni rezervace</ThemedText>
              <Pressable onPress={() => setShowManualModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedSlotForManual ? (
              <View style={[styles.selectedSlotInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="h4" style={{ marginLeft: Spacing.md }}>
                  {selectedSlotForManual.time}
                </ThemedText>
                <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
                  {selectedSlotForManual.date}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText type="h4" style={styles.modalLabel}>Jmeno klienta</ThemedText>
            <TextInput
              value={manualClientName}
              onChangeText={setManualClientName}
              placeholder="Napr. Klient z WhatsAppu"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setShowManualModal(false)}
                style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body" style={{ fontWeight: "600" }}>Zrusit</ThemedText>
              </Pressable>
              <Button
                onPress={handleManualBooking}
                style={{ backgroundColor: theme.primary, flex: 1 }}
              >
                Potvrdit
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  slotCard: {
    marginBottom: Spacing.md,
  },
  slotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  slotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    paddingBottom: Spacing["5xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalLabel: {
    marginBottom: Spacing.md,
  },
  timeScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  timeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  locationsContainer: {
    gap: Spacing.sm,
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSlotInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xl,
  },
  textInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
