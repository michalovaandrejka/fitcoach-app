import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable, RefreshControl, Alert, Modal, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAvailability, getLocations, setSlotAvailability, addTimeSlot } from "@/lib/storage";
import { TimeSlot, Location } from "@/types";

const TIME_OPTIONS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("09:00");
  const [newSlotLocation, setNewSlotLocation] = useState("");

  const loadData = async () => {
    const [slotsData, locsData] = await Promise.all([
      getAvailability(),
      getLocations(),
    ]);
    setSlots(slotsData);
    setLocations(locsData);
    if (locsData.length > 0 && !newSlotLocation) {
      setNewSlotLocation(locsData[0].id);
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
    const days = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
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

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Pobočka";
  };

  const handleToggleSlot = async (slot: TimeSlot) => {
    await setSlotAvailability(slot.id, !slot.isAvailable);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData();
  };

  const handleAddSlot = async () => {
    const existingSlot = slots.find(
      s => s.date === selectedDate && s.time === newSlotTime && s.locationId === newSlotLocation
    );
    
    if (existingSlot) {
      Alert.alert("Chyba", "Tento termín již existuje");
      return;
    }

    await addTimeSlot({
      id: `slot_${selectedDate}_${newSlotTime}_${newSlotLocation}`,
      date: selectedDate,
      time: newSlotTime,
      locationId: newSlotLocation,
      isAvailable: true,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    loadData();
  };

  const daySlots = getSlotsForDate();
  const dates = getDates();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
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
          <ThemedText type="h4">Termíny</ThemedText>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {daySlots.length > 0 ? (
          daySlots.map(slot => (
            <Card key={slot.id} elevation={1} style={styles.slotCard}>
              <View style={styles.slotContent}>
                <View style={styles.slotInfo}>
                  <ThemedText type="h4">{slot.time}</ThemedText>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                      {getLocationName(slot.locationId)}
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleToggleSlot(slot)}
                  style={[
                    styles.toggleButton,
                    { backgroundColor: slot.isAvailable ? theme.success + "20" : theme.error + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleDot,
                      { backgroundColor: slot.isAvailable ? theme.success : theme.error },
                    ]}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: slot.isAvailable ? theme.success : theme.error, fontWeight: "600" }}
                  >
                    {slot.isAvailable ? "Volný" : "Obsazeno"}
                  </ThemedText>
                </Pressable>
              </View>
            </Card>
          ))
        ) : (
          <Card elevation={1} style={styles.emptyCard}>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Na tento den nejsou nastaveny žádné termíny
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Přidat termín</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="h4" style={styles.modalLabel}>Čas</ThemedText>
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

            <ThemedText type="h4" style={styles.modalLabel}>Pobočka</ThemedText>
            <View style={styles.locationsContainer}>
              {locations.map(loc => (
                <Pressable
                  key={loc.id}
                  onPress={() => {
                    setNewSlotLocation(loc.id);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.locationOption,
                    {
                      backgroundColor: newSlotLocation === loc.id ? theme.primary + "20" : theme.backgroundSecondary,
                      borderColor: newSlotLocation === loc.id ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="body">{loc.name}</ThemedText>
                </Pressable>
              ))}
            </View>

            <Button onPress={handleAddSlot} style={{ backgroundColor: theme.primary, marginTop: Spacing.xl }}>
              Přidat termín
            </Button>
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
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
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
  locationsContainer: {
    gap: Spacing.sm,
  },
  locationOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
});
