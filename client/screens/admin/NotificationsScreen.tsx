import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, TextInput, Pressable, Alert, Platform, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiGetUsers, apiGetLocations, apiGetBookings } from "@/lib/api";
import { Location, Client, Notification } from "@/types";

const NOTIFICATIONS_KEY = "@fitcoach_notifications";

type TargetType = "all" | "booked";
type TimeFilter = "today" | "week" | "custom";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const [locs, users] = await Promise.all([
        apiGetLocations(),
        apiGetUsers(),
      ]);
      setLocations(locs.filter(l => l.isActive));
      const clients: Client[] = users
        .filter(u => u.role === "CLIENT")
        .map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          bookingsCount: 0,
        }));
      setAllClients(clients);
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se načíst data. Zkuste to prosím znovu.");
    }
  };

  const updateFilteredClients = useCallback(async () => {
    if (targetType === "all") {
      setFilteredClients(allClients);
      return;
    }

    try {
      let dateFilter: string | undefined;
      let weekFilter: boolean = false;

      if (timeFilter === "today") {
        dateFilter = new Date().toISOString().split("T")[0];
      } else if (timeFilter === "week") {
        weekFilter = true;
      } else if (timeFilter === "custom") {
        dateFilter = customDate.toISOString().split("T")[0];
      }

      const bookings = await apiGetBookings();
      
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const matchingBookings = bookings.filter((booking: any) => {
        if (weekFilter) {
          const bookingDate = new Date(booking.date);
          if (bookingDate < today || bookingDate > weekEnd) {
            return false;
          }
        } else if (dateFilter) {
          if (booking.date !== dateFilter) {
            return false;
          }
        }

        if (selectedLocationId && booking.branchId !== selectedLocationId) {
          return false;
        }

        return true;
      });

      const clientIds = new Set<string>();
      matchingBookings.forEach((booking: any) => {
        if (booking.userId) {
          clientIds.add(booking.userId);
        }
      });

      const matchedClients = allClients.filter(client => clientIds.has(client.id));
      setFilteredClients(matchedClients);
    } catch (error) {
      Alert.alert("Chyba", "Nepodařilo se načíst rezervace. Zkuste to prosím znovu.");
      setFilteredClients([]);
    }
  }, [targetType, timeFilter, selectedLocationId, customDate, allClients]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      updateFilteredClients();
    }, [updateFilteredClients])
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCustomDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const saveNotificationLocally = async (notification: Notification): Promise<void> => {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const notifications: Notification[] = data ? JSON.parse(data) : [];
      notifications.unshift(notification);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      throw new Error("Nepodařilo se uložit oznámení");
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Chyba", "Zadejte text zprávy");
      return;
    }

    if (filteredClients.length === 0) {
      Alert.alert("Chyba", "Žádní klienti neodpovídají filtrům");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const notification: Notification = {
        id: `notif_${Date.now()}`,
        title: title.trim() || undefined,
        body: message.trim(),
        targetType,
        dateFilter: timeFilter === "today" 
          ? new Date().toISOString().split("T")[0] 
          : timeFilter === "custom" 
            ? customDate.toISOString().split("T")[0]
            : undefined,
        weekFilter: timeFilter === "week" || undefined,
        locationId: selectedLocationId || undefined,
        sentAt: new Date().toISOString(),
        recipientCount: filteredClients.length,
      };

      await saveNotificationLocally(notification);

      Alert.alert(
        "Odesláno",
        `Oznámení bylo odesláno ${filteredClients.length} ${filteredClients.length === 1 ? "klientovi" : "klientům"}.`,
        [{ text: "OK", onPress: () => {
          setMessage("");
          setTitle("");
          setTargetType("all");
          setTimeFilter("today");
          setSelectedLocationId(null);
          setCustomDate(new Date());
        }}]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Chyba", "Oznámení se nepodařilo odeslat. Zkuste to prosím znovu.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const OptionButton = ({ 
    selected, 
    onPress, 
    label 
  }: { 
    selected: boolean; 
    onPress: () => void; 
    label: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionButton,
        { 
          backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText 
        type="small" 
        style={{ color: selected ? "#FFFFFF" : theme.text, fontWeight: selected ? "600" : "400" }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Text oznámení</ThemedText>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Předmět (volitelné)"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Text zprávy..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <Card elevation={1} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Komu odeslat</ThemedText>
          
          <View style={styles.optionsRow}>
            <OptionButton
              selected={targetType === "all"}
              onPress={() => setTargetType("all")}
              label="Všem klientům"
            />
            <OptionButton
              selected={targetType === "booked"}
              onPress={() => setTargetType("booked")}
              label="S rezervací"
            />
          </View>
        </Card>

        {targetType === "booked" ? (
          <>
            <Card elevation={1} style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>Časový filtr</ThemedText>
              
              <View style={styles.optionsRow}>
                <OptionButton
                  selected={timeFilter === "today"}
                  onPress={() => setTimeFilter("today")}
                  label="Dnes"
                />
                <OptionButton
                  selected={timeFilter === "week"}
                  onPress={() => setTimeFilter("week")}
                  label="Tento týden"
                />
                <OptionButton
                  selected={timeFilter === "custom"}
                  onPress={() => {
                    setTimeFilter("custom");
                    setShowDatePicker(true);
                  }}
                  label="Vybrat den"
                />
              </View>

              {timeFilter === "custom" ? (
                <Pressable 
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                >
                  <Feather name="calendar" size={20} color={theme.primary} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    {formatDate(customDate)}
                  </ThemedText>
                </Pressable>
              ) : null}
            </Card>

            <Card elevation={1} style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>Pobočka</ThemedText>
              
              <View style={styles.optionsRow}>
                <OptionButton
                  selected={selectedLocationId === null}
                  onPress={() => setSelectedLocationId(null)}
                  label="Všechny"
                />
                {locations.map(loc => (
                  <OptionButton
                    key={loc.id}
                    selected={selectedLocationId === loc.id}
                    onPress={() => setSelectedLocationId(loc.id)}
                    label={loc.name}
                  />
                ))}
              </View>
            </Card>
          </>
        ) : null}

        <Card elevation={1} style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Feather name="users" size={20} color={theme.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
              Příjemci: <ThemedText type="body" style={{ fontWeight: "700", color: theme.primary }}>
                {filteredClients.length}
              </ThemedText> {filteredClients.length === 1 ? "klient" : "klientů"}
            </ThemedText>
          </View>
        </Card>

        <Button
          onPress={handleSend}
          disabled={isLoading || !message.trim() || filteredClients.length === 0}
          style={{ backgroundColor: theme.primary }}
        >
          <View style={styles.buttonContent}>
            <Feather name="send" size={18} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: Spacing.sm }}>
              Odeslat oznámení
            </ThemedText>
          </View>
        </Button>
      </ScrollView>

      {Platform.OS === "ios" ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.modalHeader}>
                <ThemedText type="h4">Vyberte datum</ThemedText>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <ThemedText type="body" style={{ color: theme.primary }}>Hotovo</ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={customDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                locale="cs"
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker ? (
          <DateTimePicker
            value={customDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        ) : null
      )}
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  previewSection: {
    marginBottom: Spacing.xl,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing["3xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
});
