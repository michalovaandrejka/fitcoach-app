import React, { useState, useCallback, useMemo } from "react";
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
  apiGetAvailability,
  apiGetLocations,
  apiCreateAvailabilityBlock,
  apiDeleteAvailabilityBlock,
  apiCreateBooking,
  apiDeleteBooking,
  apiGetBookings
} from "@/lib/api";
import { AvailabilityBlock, Location, Booking, TRAINING_DURATION } from "@/types";

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

const WEEKDAY_NAMES = ["Po", "Ut", "St", "Ct", "Pa", "So", "Ne"];
const MONTH_NAMES = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [allBlocks, setAllBlocks] = useState<AvailabilityBlock[]>([]);
  const [dayBlocks, setDayBlocks] = useState<AvailabilityBlock[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [modalMonth, setModalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStartTime, setManualStartTime] = useState("09:00");
  const [manualClientName, setManualClientName] = useState("");
  const [manualBranchId, setManualBranchId] = useState("");
  const [selectedBlockForManual, setSelectedBlockForManual] = useState<AvailabilityBlock | null>(null);

  const loadData = async () => {
    const [locsData, blocksData, daySchedule] = await Promise.all([
      apiGetLocations(),
      apiGetAvailability(),
      Promise.all([
        apiGetAvailability(selectedDate),
        apiGetBookings(selectedDate),
      ]),
    ]);
    setLocations(locsData);
    setAllBlocks(blocksData);
    const [dayBlocksData, dayBookingsData] = daySchedule;
    setDayBlocks(dayBlocksData);
    setBookings(dayBookingsData);
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

  const getMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startWeekday = firstDay.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
    
    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const day = prevMonthLastDay - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ date: dateStr, dayNum: day, isCurrentMonth: false });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let d = 1; d <= remainingDays; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: false });
    }
    
    return days;
  };

  const getBlockCountForDate = (dateStr: string) => {
    return allBlocks.filter(b => b.date === dateStr).length;
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
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
    return locations.find(l => l.id === branchId)?.name || "Neznámá pobočka";
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleOpenAddModal = () => {
    const now = new Date();
    setModalMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDates([selectedDate]);
    setStartTime("09:00");
    setEndTime("17:00");
    setSelectedBranchIds(locations.map(l => l.id));
    setShowAddModal(true);
  };

  const handleToggleDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (dateStr < today) return;
    
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
    Haptics.selectionAsync();
  };

  const handleSelectAllWeekday = (weekday: number) => {
    const days = getMonthDays(modalMonth.year, modalMonth.month);
    const today = new Date().toISOString().split("T")[0];
    
    const weekdayDates = days
      .filter(d => d.isCurrentMonth)
      .filter(d => {
        const date = new Date(d.date);
        let dayOfWeek = date.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return dayOfWeek === weekday && d.date >= today;
      })
      .map(d => d.date);
    
    const allSelected = weekdayDates.every(d => selectedDates.includes(d));
    
    if (allSelected) {
      setSelectedDates(prev => prev.filter(d => !weekdayDates.includes(d)));
    } else {
      setSelectedDates(prev => [...new Set([...prev, ...weekdayDates])]);
    }
    Haptics.selectionAsync();
  };

  const handleSelectWholeMonth = () => {
    const days = getMonthDays(modalMonth.year, modalMonth.month);
    const today = new Date().toISOString().split("T")[0];
    
    const monthDates = days
      .filter(d => d.isCurrentMonth && d.date >= today)
      .map(d => d.date);
    
    const allSelected = monthDates.every(d => selectedDates.includes(d));
    
    if (allSelected) {
      setSelectedDates(prev => prev.filter(d => !monthDates.includes(d)));
    } else {
      setSelectedDates(prev => [...new Set([...prev, ...monthDates])]);
    }
    Haptics.selectionAsync();
  };

  const handleSelectWorkdays = () => {
    const days = getMonthDays(modalMonth.year, modalMonth.month);
    const today = new Date().toISOString().split("T")[0];
    
    const workdayDates = days
      .filter(d => d.isCurrentMonth && d.date >= today)
      .filter(d => {
        const date = new Date(d.date);
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      })
      .map(d => d.date);
    
    const allSelected = workdayDates.every(d => selectedDates.includes(d));
    
    if (allSelected) {
      setSelectedDates(prev => prev.filter(d => !workdayDates.includes(d)));
    } else {
      setSelectedDates(prev => [...new Set([...prev, ...workdayDates])]);
    }
    Haptics.selectionAsync();
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
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
      Alert.alert("Chyba", "Vyberte alespoň jeden den");
      return;
    }
    if (selectedBranchIds.length === 0) {
      Alert.alert("Chyba", "Vyberte alespoň jednu pobočku");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      Alert.alert("Chyba", "Čas konce musí být po čase začátku");
      return;
    }
    if (timeToMinutes(endTime) - timeToMinutes(startTime) < TRAINING_DURATION) {
      Alert.alert("Chyba", `Blok musí být alespoň ${TRAINING_DURATION} minut`);
      return;
    }

    try {
      for (const date of selectedDates) {
        for (const branchId of selectedBranchIds) {
          await apiCreateAvailabilityBlock({ date, startTime, endTime, branchId });
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodařilo se přidat bloky");
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
        { text: "Zrušit", style: "cancel" },
        {
          text: "Smazat",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteAvailabilityBlock(block.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodařilo se smazat blok");
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
    const allDayBookings = bookings;
    
    const availableTimes: string[] = [];
    
    for (let start = blockStart; start + TRAINING_DURATION <= blockEnd; start += 15) {
      const end = start + TRAINING_DURATION;
      
      const hasCollision = allDayBookings.some(b => {
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
      Alert.alert("Chyba", "Zadejte jméno klienta");
      return;
    }

    try {
      await apiCreateBooking(
        selectedDate,
        manualStartTime,
        manualBranchId,
        getBranchName(manualBranchId),
        manualClientName.trim()
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowManualModal(false);
      loadData();
    } catch (error) {
      Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodařilo se vytvořit rezervaci");
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    const clientName = booking.bookingType === "manual" 
      ? booking.manualClientName 
      : booking.userName;
    
    Alert.alert(
      "Zrušit rezervaci",
      `Opravdu chcete zrušit rezervaci?\n\nKlient: ${clientName}\nČas: ${booking.startTime} - ${booking.endTime}`,
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Zrušit",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteBooking(booking.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert("Chyba", error instanceof Error ? error.message : "Nepodařilo se zrušit rezervaci");
            }
          },
        },
      ]
    );
  };

  const handleModalPrevMonth = () => {
    setModalMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleModalNextMonth = () => {
    setModalMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const sortedDayBlocks = dayBlocks.sort((a, b) => {
    const timeCompare = a.startTime.localeCompare(b.startTime);
    if (timeCompare !== 0) return timeCompare;
    return getBranchName(a.branchId).localeCompare(getBranchName(b.branchId));
  });

  const calendarDays = useMemo(() => getMonthDays(currentMonth.year, currentMonth.month), [currentMonth]);
  const modalCalendarDays = useMemo(() => getMonthDays(modalMonth.year, modalMonth.month), [modalMonth]);
  const today = new Date().toISOString().split("T")[0];

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
        <View style={styles.monthHeader}>
          <Pressable onPress={handlePrevMonth} style={[styles.monthNavButton, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">
            {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
          </ThemedText>
          <Pressable onPress={handleNextMonth} style={[styles.monthNavButton, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="chevron-right" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.weekdayHeader}>
            {WEEKDAY_NAMES.map(day => (
              <View key={day} style={styles.weekdayCell}>
                <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const isSelected = day.date === selectedDate;
              const isToday = day.date === today;
              const blockCount = getBlockCountForDate(day.date);
              const isPast = day.date < today;
              
              return (
                <Pressable
                  key={`${day.date}_${index}`}
                  onPress={() => {
                    if (day.isCurrentMonth) {
                      setSelectedDate(day.date);
                      Haptics.selectionAsync();
                    }
                  }}
                  style={[
                    styles.calendarDay,
                    { 
                      backgroundColor: isSelected ? theme.primary : "transparent",
                      opacity: day.isCurrentMonth ? (isPast ? 0.5 : 1) : 0.3,
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{ 
                      color: isSelected ? "#FFFFFF" : (isToday ? theme.primary : theme.text),
                      fontWeight: isToday || isSelected ? "700" : "400",
                    }}
                  >
                    {day.dayNum}
                  </ThemedText>
                  {blockCount > 0 && day.isCurrentMonth ? (
                    <View style={[styles.blockIndicator, { backgroundColor: isSelected ? "#FFFFFF" : theme.primary }]}>
                      <ThemedText type="small" style={{ color: isSelected ? theme.primary : "#FFFFFF", fontSize: 10, fontWeight: "600" }}>
                        {blockCount}
                      </ThemedText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.headerRow}>
          <View>
            <ThemedText type="h4">Pracovní bloky</ThemedText>
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

        {sortedDayBlocks.length > 0 ? (
          sortedDayBlocks.map(block => {
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
                      {availableSlotsCount > 0 ? `${availableSlotsCount} volných míst` : "Plně obsazeno"}
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
              Na tento den nejsou nastaveny žádné pracovní bloky
            </ThemedText>
            <Button onPress={handleOpenAddModal} style={{ backgroundColor: theme.primary, marginTop: Spacing.lg }}>
              Přidat blok
            </Button>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Přidat pracovní blok</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.monthHeader}>
                <Pressable onPress={handleModalPrevMonth} style={[styles.monthNavButton, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="chevron-left" size={20} color={theme.text} />
                </Pressable>
                <ThemedText type="h4">
                  {MONTH_NAMES[modalMonth.month]} {modalMonth.year}
                </ThemedText>
                <Pressable onPress={handleModalNextMonth} style={[styles.monthNavButton, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="chevron-right" size={20} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.quickSelectRow}>
                <Pressable 
                  onPress={handleSelectWholeMonth}
                  style={[styles.quickSelectButton, { backgroundColor: theme.primary + "20", borderColor: theme.primary }]}
                >
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>Cely mesic</ThemedText>
                </Pressable>
                <Pressable 
                  onPress={handleSelectWorkdays}
                  style={[styles.quickSelectButton, { backgroundColor: theme.primary + "20", borderColor: theme.primary }]}
                >
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>Pracovní dny</ThemedText>
                </Pressable>
                <Pressable 
                  onPress={handleClearSelection}
                  style={[styles.quickSelectButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                >
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Zrušit výběr</ThemedText>
                </Pressable>
              </View>

              <View style={styles.weekdaySelectRow}>
                {WEEKDAY_NAMES.map((day, index) => (
                  <Pressable
                    key={day}
                    onPress={() => handleSelectAllWeekday(index)}
                    style={[styles.weekdaySelectButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>{day}</ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.calendarContainer}>
                <View style={styles.weekdayHeader}>
                  {WEEKDAY_NAMES.map(day => (
                    <View key={day} style={styles.weekdayCell}>
                      <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                        {day}
                      </ThemedText>
                    </View>
                  ))}
                </View>
                
                <View style={styles.calendarGrid}>
                  {modalCalendarDays.map((day, index) => {
                    const isSelected = selectedDates.includes(day.date);
                    const isPast = day.date < today;
                    const isDisabled = !day.isCurrentMonth || isPast;
                    
                    return (
                      <Pressable
                        key={`modal_${day.date}_${index}`}
                        onPress={() => !isDisabled && handleToggleDate(day.date)}
                        style={[
                          styles.calendarDay,
                          { 
                            backgroundColor: isSelected ? theme.primary : "transparent",
                            opacity: isDisabled ? 0.3 : 1,
                          },
                        ]}
                      >
                        <ThemedText
                          type="body"
                          style={{ 
                            color: isSelected ? "#FFFFFF" : theme.text,
                            fontWeight: isSelected ? "700" : "400",
                          }}
                        >
                          {day.dayNum}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <ThemedText type="small" style={{ color: theme.primary, textAlign: "center", marginTop: Spacing.md }}>
                Vybrano: {selectedDates.length} dnu
              </ThemedText>

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
              Přidat bloky ({selectedDates.length} dnu x {selectedBranchIds.length} poboce)
            </Button>
          </View>
        </View>
      </Modal>

      <Modal visible={showManualModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Manuální rezervace</ThemedText>
              <Pressable onPress={() => setShowManualModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedBlockForManual ? (
              <View style={[styles.selectedBlockInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="clock" size={18} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                  {selectedBlockForManual.startTime} - {selectedBlockForManual.endTime}
                </ThemedText>
              </View>
            ) : null}

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ThemedText type="h4" style={styles.modalLabel}>Jméno klienta</ThemedText>
              <TextInput
                value={manualClientName}
                onChangeText={setManualClientName}
                placeholder="Zadejte jméno klienta"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              />

              <ThemedText type="h4" style={styles.modalLabel}>Čas začátku tréninku</ThemedText>
              {availableStartTimes.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                  {availableStartTimes.map(time => (
                    <Pressable
                      key={`manual_${time}`}
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
                <ThemedText type="body" style={{ color: theme.error }}>
                  Žádné volné časy v tomto bloku
                </ThemedText>
              )}
            </ScrollView>

            <Button 
              onPress={handleManualBooking} 
              disabled={availableStartTimes.length === 0}
              style={{ backgroundColor: availableStartTimes.length > 0 ? theme.primary : theme.textSecondary, marginTop: Spacing.xl }}
            >
              Vytvořit rezervaci ({TRAINING_DURATION} min)
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
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarContainer: {
    marginBottom: Spacing.xl,
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
  },
  blockIndicator: {
    position: "absolute",
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: Spacing.md,
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
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  branchBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  bookingsList: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  bookingInfo: {
    flex: 1,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalLabel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickSelectRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  quickSelectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  weekdaySelectRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  weekdaySelectButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  timeScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  timeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  branchesContainer: {
    gap: Spacing.md,
  },
  branchOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBlockInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
  },
});
