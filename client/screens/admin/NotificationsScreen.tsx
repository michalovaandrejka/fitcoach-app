import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, TextInput, Pressable, Alert, Platform } from "react-native";
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
import { getClients, getLocations, getBookedClientsForFilter, saveNotification } from "@/lib/storage";
import { Location, Client, Notification } from "@/types";

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
  const [customDate, setCustomDate] = useState("");
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    const [locs, clients] = await Promise.all([
      getLocations(),
      getClients(),
    ]);
    setLocations(locs.filter(l => l.isActive));
    setAllClients(clients);
    updateFilteredClients();
  };

  const updateFilteredClients = async () => {
    if (targetType === "all") {
      setFilteredClients(allClients);
      return;
    }

    let dateFilter: string | undefined;
    let weekFilter: boolean | undefined;

    if (timeFilter === "today") {
      dateFilter = new Date().toISOString().split("T")[0];
    } else if (timeFilter === "week") {
      weekFilter = true;
    } else if (timeFilter === "custom" && customDate) {
      dateFilter = customDate;
    }

    const clients = await getBookedClientsForFilter(
      dateFilter,
      weekFilter,
      selectedLocationId || undefined
    );
    setFilteredClients(clients);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      updateFilteredClients();
    }, [targetType, timeFilter, selectedLocationId, customDate, allClients])
  );

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Chyba", "Zadejte text zpravy");
      return;
    }

    if (filteredClients.length === 0) {
      Alert.alert("Chyba", "Zadni klienti neodpovidaji filtrum");
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
            ? customDate 
            : undefined,
        weekFilter: timeFilter === "week" || undefined,
        locationId: selectedLocationId || undefined,
        sentAt: new Date().toISOString(),
        recipientCount: filteredClients.length,
      };

      await saveNotification(notification);

      Alert.alert(
        "Odeslano",
        `Oznameni bylo odeslano ${filteredClients.length} ${filteredClients.length === 1 ? "klientovi" : "klientum"}.`,
        [{ text: "OK", onPress: () => {
          setMessage("");
          setTitle("");
          setTargetType("all");
          setTimeFilter("today");
          setSelectedLocationId(null);
          setCustomDate("");
        }}]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Chyba", "Oznameni se nepodarilo odeslat");
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
          <ThemedText type="h4" style={styles.sectionTitle}>Text oznameni</ThemedText>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Predmet (volitelne)"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
            placeholder="Text zpravy..."
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
              label="Vsem klientum"
            />
            <OptionButton
              selected={targetType === "booked"}
              onPress={() => setTargetType("booked")}
              label="S rezervaci"
            />
          </View>
        </Card>

        {targetType === "booked" ? (
          <>
            <Card elevation={1} style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>Casovy filtr</ThemedText>
              
              <View style={styles.optionsRow}>
                <OptionButton
                  selected={timeFilter === "today"}
                  onPress={() => setTimeFilter("today")}
                  label="Dnes"
                />
                <OptionButton
                  selected={timeFilter === "week"}
                  onPress={() => setTimeFilter("week")}
                  label="Tento tyden"
                />
                <OptionButton
                  selected={timeFilter === "custom"}
                  onPress={() => setTimeFilter("custom")}
                  label="Vybrat den"
                />
              </View>

              {timeFilter === "custom" ? (
                <TextInput
                  style={[styles.input, styles.dateInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  placeholder="RRRR-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={customDate}
                  onChangeText={setCustomDate}
                />
              ) : null}
            </Card>

            <Card elevation={1} style={styles.section}>
              <ThemedText type="h4" style={styles.sectionTitle}>Pobocka</ThemedText>
              
              <View style={styles.optionsRow}>
                <OptionButton
                  selected={selectedLocationId === null}
                  onPress={() => setSelectedLocationId(null)}
                  label="Vsechny"
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
              Prijemci: <ThemedText type="body" style={{ fontWeight: "700", color: theme.primary }}>
                {filteredClients.length}
              </ThemedText> {filteredClients.length === 1 ? "klient" : "klientu"}
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
              Odeslat oznameni
            </ThemedText>
          </View>
        </Button>
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
  dateInput: {
    marginTop: Spacing.md,
    marginBottom: 0,
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
});
