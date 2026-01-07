import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Pressable, Modal } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Onboarding } from "@/components/Onboarding";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getUsers, getBookings, getAvailabilityBlocks, getAvailableStartTimes } from "@/lib/storage";
import { Booking, AvailabilityBlock } from "@/types";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    clientsCount: 0,
    todayBookings: 0,
    availableSlots: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const loadData = async () => {
    const [users, bookings, blocks] = await Promise.all([
      getUsers(),
      getBookings(),
      getAvailabilityBlocks(),
    ]);
    
    const clientUsers = users.filter(u => u.role === "CLIENT");
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b: Booking) => b.date === today);
    
    const futureDates = [...new Set(blocks.filter((b: AvailabilityBlock) => b.date >= today).map(b => b.date))];
    let totalAvailableSlots = 0;
    for (const date of futureDates) {
      const slots = await getAvailableStartTimes(date);
      totalAvailableSlots += slots.length;
    }
    
    setStats({
      clientsCount: clientUsers.length,
      todayBookings: todayBookings.length,
      availableSlots: totalAvailableSlots,
    });
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

  const StatCard = ({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
    <Card elevation={1} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText type="h2" style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
    </Card>
  );

  const QuickAction = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.quickAction, { backgroundColor: theme.primary }]}
    >
      <Feather name={icon} size={20} color="#FFFFFF" />
      <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Vítejte zpět,
          </ThemedText>
          <ThemedText type="h2">{user?.name}</ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="users" label="Klientů celkem" value={stats.clientsCount} color={theme.primary} />
          <StatCard icon="calendar" label="Tréninků dnes" value={stats.todayBookings} color={theme.secondary} />
        </View>
        
        <Card elevation={1} style={styles.fullWidthStat}>
          <View style={styles.fullWidthStatContent}>
            <View style={[styles.statIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="clock" size={24} color={theme.success} />
            </View>
            <View style={styles.fullWidthStatText}>
              <ThemedText type="h3">{stats.availableSlots}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Volných termínů</ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText type="h4" style={styles.sectionTitle}>Rychlé akce</ThemedText>
        
        <View style={styles.quickActions}>
          <QuickAction
            icon="plus"
            label="Přidat dostupnost"
            onPress={() => navigation.navigate("AvailabilityStack")}
          />
          <QuickAction
            icon="calendar"
            label="Zobrazit kalendář"
            onPress={() => navigation.navigate("CalendarStack")}
          />
        </View>

        <View style={styles.clientsLink}>
          <Card
            elevation={1}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("ClientsStack");
            }}
          >
            <View style={styles.clientsCardContent}>
              <View style={[styles.clientsIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="users" size={24} color={theme.primary} />
              </View>
              <View style={styles.clientsText}>
                <ThemedText type="h4">Zobrazit všechny klienty</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Správa klientů a jejich rezervací
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </View>
          </Card>
        </View>

        <View style={styles.tutorialLink}>
          <Card
            elevation={1}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTutorial(true);
            }}
          >
            <View style={styles.tutorialCardContent}>
              <View style={[styles.tutorialIcon, { backgroundColor: theme.secondary + "20" }]}>
                <Feather name="help-circle" size={24} color={theme.secondary} />
              </View>
              <View style={styles.tutorialText}>
                <ThemedText type="h4">Spustit tutoriál</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Zobrazit průvodce aplikací
                </ThemedText>
              </View>
              <Feather name="play" size={24} color={theme.secondary} />
            </View>
          </Card>
        </View>
      </ScrollView>

      {showTutorial ? (
        <Modal visible animationType="slide" presentationStyle="fullScreen">
          <Onboarding isManual onComplete={() => setShowTutorial(false)} />
        </Modal>
      ) : null}
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
  header: {
    marginBottom: Spacing["2xl"],
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  fullWidthStat: {
    marginBottom: Spacing["2xl"],
  },
  fullWidthStatContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullWidthStatText: {
    marginLeft: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  quickActions: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  clientsLink: {
    marginBottom: Spacing.lg,
  },
  clientsCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientsText: {
    flex: 1,
  },
  tutorialLink: {
    marginBottom: Spacing.lg,
  },
  tutorialCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tutorialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  tutorialText: {
    flex: 1,
  },
});
