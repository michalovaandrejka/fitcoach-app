import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable, RefreshControl, Alert, Modal, TextInput } from "react-native";
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
import { 
  getAvailabilityBlocks, 
  getLocations, 
  addAvailabilityBlocks, 
  deleteAvailabilityBlock, 
  createManualBooking, 
  cancelBooking,
  getDaySchedule
} from "@/lib/storage";
import { AvailabilityBlock, Location, Booking, TRAINING_DURATION } from "@/types";

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualClientName, setManualClientName] = useState("");
  const [manualBranchId, setManualBranchId] = useState("");
  const [selectedBlockForManual, setSelectedBlockForManual] = useState<AvailabilityBlock | null>(null);

  const loadData = async () => {
    const [locsData, scheduleData] = await Promise.all([
      getLocations(),
      getDaySchedule(selectedDate),
    ]);
    setLocations(locsData);
    setBlocks(scheduleData.blocks);
    setBookings(scheduleData.bookings);
    if (locsData.length > 0 && selectedBranchIds.length === 0) {
      setSelectedBranchIds(locsData.map(l => l.id));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
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

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Nedele", "Pondeli", "Utery", "Streda", "Ctvrtek", "Patek", "Sobota"];
    const months = ["ledna", "unora", "brezna", "dubna", "kvetna", "cervna", "cervence", "srpna", "zari", "rijna", "listopadu", "prosince"];
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const getBlockBookings = (block: AvailabilityBlock) => {
    return bookings.filter(b => 
      b.branchId === block.branchId &&
      timeToMinutes(b.startTime) >= timeToMinutes(block.startTime) &&
      timeToMinutes(b.endTime) <= timeToMinutes(block.endTime)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getBranchName = (branchId: string) => {
    return locations.find(l => l.id === branchId)?.name || "Neznama pobocka";
  };

  const handleOpenAddModal = () => {
    setSelectedDates([selectedDate]);
    setStartTime("09:00");
    setEndTime("17:00");
    setSelectedBranchIds(locations.map(l => l.id));
    setShowAddModal(true);
  };

  const handleToggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
    Haptics.selectionAsync();
  };

  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds(prev => {
      if (prev.includes(branchId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== branchId);
      }
      return [...prev, branchId];
    });
    Haptics.selectionAsync();
  };

  const handleAddBlocks = async () => {
    if (selectedDates.length === 0) {
      Alert.alert("Chyba", "Vyberte alespon jeden den");
      return;
    }
    if (selectedBranchIds.length === 0) {
      Alert.alert("Chyba", "Vyberte alespon jednu pobocku");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      Alert.alert("Chyba", "Cas konce musi byt po casu zacatku");
      return;
    }
    if (timeToMinutes(endTime) - timeToMinutes(startTime) < TRAINING_DURATION) {
      Alert.alert("Chyba", `Blok musi byt alespon ${TRAINING_DURATION} minut`);
      return;
    }

    try {
      await addAvailabilityBlocks(selectedDates, startTime, endTime, selectedBranchIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se pridat bloky");
    }
  };

  const handleDeleteBlock = async (block: AvailabilityBlock) => {
    const blockBookings = getBlockBookings(block);
    if (blockBookings.length > 0) {
      Alert.alert("Nelze smazat", "Tento blok obsahuje rezervace");
      return;
    }

    Alert.alert(
      "Smazat blok",
      `Opravdu chcete smazat blok ${block.startTime} - ${block.endTime}?`,
      [
        { text: "Zrusit", style: "cancel" },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAvailabilityBlock(block.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se smazat blok");
            }
          },
        },
      ]
    );
  };

  const handleOpenManualModal = (block: AvailabilityBlock) => {
    setSelectedBlockForManual(block);
    setManualStartTime(block.startTime);
    setManualBranchId(block.branchId);
    setManualClientName("");
    setShowManualModal(true);
  };

  const getAvailableStartTimesForBlock = (block: AvailabilityBlock): string[] => {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);
    const blockBookings = getBlockBookings(block);
    
    const availableTimes: string[] = [];
    
    for (let start = blockStart; start + TRAINING_DURATION <= blockEnd; start += 15) {
      const end = start + TRAINING_DURATION;
      
      const hasCollision = blockBookings.some(b => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return start < bEnd && end > bStart;
      });
      
      if (!hasCollision) {
        availableTimes.push(minutesToTime(start));
      }
    }
    
    return availableTimes;
  };

  const handleManualBooking = async () => {
    if (!selectedBlockForManual) return;
    
    if (!manualClientName.trim()) {
      Alert.alert("Chyba", "Zadejte jmeno klienta");
      return;
    }

    try {
      await createManualBooking(
        selectedDate,
        manualStartTime,
        manualBranchId,
        manualClientName.trim()
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowManualModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodarilo se vytvorit rezervaci");
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    const clientName = booking.bookingType === "manual" 
      ? booking.manualClientName 
      : booking.userName;
    
    Alert.alert(
      "Zrusit rezervaci",
      `Opravdu chcete zrusit rezervaci?\n\nKlient: ${clientName}\nCas: ${booking.startTime} - ${booking.endTime}`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Zrusit",
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
  };

  const dayBlocks = blocks.sort((a, b) => {
    const timeCompare = a.startTime.localeCompare(b.startTime);
    if (timeCompare !== 0) return timeCompare;
    return getBranchName(a.branchId).localeCompare(getBranchName(b.branchId));
  });

  const availableStartTimes = selectedBlockForManual 
    ? getAvailableStartTimesForBlock(selectedBlockForManual)
    : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll} contentContainerStyle={styles.datesContent}>
          {getDates().map(dateStr => {
            const { day, date } = formatDateShort(dateStr);
            const isSelected = dateStr === selectedDate;
            return (
              <Pressable
                key={dateStr}
                onPress={() => {
                  setSelectedDate(dateStr);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.dateCard,
                  { backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary, fontWeight: "600" }}
                >
                  {day}
                </ThemedText>
                <ThemedText
                  type="h3"
                  style={{ color: isSelected ? "#FFFFFF" : theme.text }}
                >
                  {date}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.headerRow}>
          <View>
            <ThemedText type="h4">Pracovni bloky</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatDateFull(selectedDate)}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleOpenAddModal}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {dayBlocks.length > 0 ? (
          dayBlocks.map(block => {
            const blockBookings = getBlockBookings(block);
            const availableSlotsCount = getAvailableStartTimesForBlock(block).length;
            
            return (
              <Card key={block.id} elevation={1} style={styles.blockCard}>
                <View style={styles.blockHeader}>
                  <View style={styles.blockTime}>
                    <Feather name="clock" size={18} color={theme.primary} />
                    <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
                      {block.startTime} - {block.endTime}
                    </ThemedText>
                  </View>
                  <View style={styles.blockActions}>
                    <Pressable
                      onPress={() => handleOpenManualModal(block)}
                      style={[styles.iconButton, { backgroundColor: theme.primary + "20" }]}
                    >
                      <Feather name="user-plus" size={16} color={theme.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteBlock(block)}
                      style={[styles.iconButton, { backgroundColor: theme.error + "20" }]}
                    >
                      <Feather name="trash-2" size={16} color={theme.error} />
                    </Pressable>
                  </View>
                </View>
                
                <View style={styles.blockMeta}>
                  <View style={[styles.branchBadge, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="map-pin" size={12} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                      {getBranchName(block.branchId)}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: availableSlotsCount > 0 ? theme.success + "20" : theme.error + "20" }]}>
                    <ThemedText type="small" style={{ color: availableSlotsCount > 0 ? theme.success : theme.error, fontWeight: "600" }}>
                      {availableSlotsCount > 0 ? `${availableSlotsCount} volnych mist` : "Plne obsazeno"}
                    </ThemedText>
                  </View>
                </View>

                {blockBookings.length > 0 ? (
                  <View style={styles.bookingsList}>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                      Rezervace:
                    </ThemedText>
                    {blockBookings.map(booking => (
                      <Pressable
                        key={booking.id}
                        onPress={() => handleCancelBooking(booking)}
                        style={[styles.bookingItem, { backgroundColor: theme.backgroundSecondary }]}
                      >
                        <View style={styles.bookingInfo}>
                          <ThemedText type="body" style={{ fontWeight: "600" }}>
                            {booking.startTime} - {booking.endTime}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: theme.primary }}>
                            {booking.bookingType === "manual" ? booking.manualClientName : booking.userName}
                            {booking.bookingType === "manual" ? " (manualne)" : ""}
                          </ThemedText>
                        </View>
                        <Feather name="x" size={16} color={theme.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })
        ) : (
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="calendar" size={40} color={theme.textSecondary} style={{ marginBottom: Spacing.md }} />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Na tento den nejsou nastaveny zadne pracovni bloky
            </ThemedText>
            <Button onPress={handleOpenAddModal} style={{ backgroundColor: theme.primary, marginTop: Spacing.lg }}>
              Pridat blok
            </Button>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Pridat pracovni blok</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ThemedText type="h4" style={styles.modalLabel}>Dny</ThemedText>
              <View style={styles.datesGrid}>
                {getDates().map(dateStr => {
                  const { day, date } = formatDateShort(dateStr);
                  const isSelected = selectedDates.includes(dateStr);
                  return (
                    <Pressable
                      key={dateStr}
                      onPress={() => handleToggleDate(dateStr)}
                      style={[
                        styles.dateOption,
                        { 
                          backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText type="small" style={{ color: isSelected ? "#FFFFFF" : theme.textSecondary }}>
                        {day}
                      </ThemedText>
                      <ThemedText type="body" style={{ color: isSelected ? "#FFFFFF" : theme.text, fontWeight: "600" }}>
                        {date}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText type="h4" style={styles.modalLabel}>Cas od</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map(time => (
                  <Pressable
                    key={`start_${time}`}
                    onPress={() => {
                      setStartTime(time);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.timeOption,
                      { backgroundColor: startTime === time ? theme.primary : theme.backgroundSecondary },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: startTime === time ? "#FFFFFF" : theme.text, fontWeight: "600" }}
                    >
                      {time}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <ThemedText type="h4" style={styles.modalLabel}>Cas do</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {TIME_OPTIONS.map(time => (
                  <Pressable
                    key={`end_${time}`}
                    onPress={() => {
                      setEndTime(time);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.timeOption,
                      { backgroundColor: endTime === time ? theme.primary : theme.backgroundSecondary },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: endTime === time ? "#FFFFFF" : theme.text, fontWeight: "600" }}
                    >
                      {time}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <ThemedText type="h4" style={styles.modalLabel}>Pobocky</ThemedText>
              <View style={styles.branchesContainer}>
                {locations.map(loc => {
                  const isSelected = selectedBranchIds.includes(loc.id);
                  return (
                    <Pressable
                      key={loc.id}
                      onPress={() => handleToggleBranch(loc.id)}
                      style={[
                        styles.branchOption,
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
            </ScrollView>

            <Button onPress={handleAddBlocks} style={{ backgroundColor: theme.primary, marginTop: Spacing.xl }}>
              Pridat bloky ({selectedDates.length} dnu x {selectedBranchIds.length} poboce)
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

            {selectedBlockForManual ? (
              <View style={[styles.selectedBlockInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  Blok: {selectedBlockForManual.startTime} - {selectedBlockForManual.endTime}
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

            <ThemedText type="h4" style={styles.modalLabel}>Start treninku ({TRAINING_DURATION} min)</ThemedText>
            {availableStartTimes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {availableStartTimes.map(time => (
                  <Pressable
                    key={time}
                    onPress={() => {
                      setManualStartTime(time);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.timeOption,
                      { backgroundColor: manualStartTime === time ? theme.primary : theme.backgroundSecondary },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: manualStartTime === time ? "#FFFFFF" : theme.text, fontWeight: "600" }}
                    >
                      {time}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.noSlotsMessage, { backgroundColor: theme.error + "20" }]}>
                <ThemedText type="body" style={{ color: theme.error, textAlign: "center" }}>
                  Zadne volne casy v tomto bloku
                </ThemedText>
              </View>
            )}

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
                disabled={availableStartTimes.length === 0}
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
    width: 60,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  blockCard: {
    marginBottom: Spacing.md,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  blockTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  blockActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  blockMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  branchBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  bookingsList: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  bookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  bookingInfo: {
    flex: 1,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
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
    maxHeight: "85%",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  datesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dateOption: {
    width: 52,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    borderWidth: 1,
  },
  timeScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  timeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  branchesContainer: {
    gap: Spacing.sm,
  },
  branchOption: {
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
  selectedBlockInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  textInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  noSlotsMessage: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
