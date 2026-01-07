import React from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Odhlásit se",
      "Opravdu se chcete odhlásit?",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Ano",
          onPress: async () => {
            await logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.secondary }]}>
            <Feather name="award" size={48} color="#FFFFFF" />
          </View>
          <ThemedText type="h2" style={styles.name}>{user?.name}</ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: theme.secondary + "20" }]}>
            <ThemedText type="small" style={{ color: theme.secondary, fontWeight: "600" }}>
              Trenérka
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            {user?.email}
          </ThemedText>
        </View>

        <Card elevation={1} style={styles.card}>
          <ThemedText type="h4" style={styles.sectionTitle}>Informace o účtu</ThemedText>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="mail" size={18} color={theme.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Email</ThemedText>
              <ThemedText type="body">{user?.email}</ThemedText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="shield" size={18} color={theme.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Role</ThemedText>
              <ThemedText type="body">Administrátor</ThemedText>
            </View>
          </View>
        </Card>

        <Card elevation={1} style={styles.card}>
          <ThemedText type="h4" style={styles.sectionTitle}>Aplikace</ThemedText>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="info" size={18} color={theme.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Verze</ThemedText>
              <ThemedText type="body">1.0.0</ThemedText>
            </View>
          </View>
        </Card>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: theme.error }]}
        >
          <Feather name="log-out" size={20} color={theme.error} />
          <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
            Odhlásit se
          </ThemedText>
        </Pressable>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  name: {
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
});
