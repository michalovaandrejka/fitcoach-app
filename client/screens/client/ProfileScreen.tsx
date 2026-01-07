import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert } from "react-native";
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

const AVATARS = [
  { id: 1, icon: "user" as const, color: "#FF6B35" },
  { id: 2, icon: "activity" as const, color: "#4CAF50" },
  { id: 3, icon: "heart" as const, color: "#E91E63" },
  { id: 4, icon: "zap" as const, color: "#9C27B0" },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  
  const [selectedAvatar, setSelectedAvatar] = useState(1);

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
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: AVATARS.find(a => a.id === selectedAvatar)?.color }]}>
            <Feather
              name={AVATARS.find(a => a.id === selectedAvatar)?.icon || "user"}
              size={48}
              color="#FFFFFF"
            />
          </View>
          <ThemedText type="h2" style={styles.name}>{user?.name}</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>{user?.email}</ThemedText>
        </View>

        <Card elevation={1} style={styles.card}>
          <ThemedText type="h4" style={styles.sectionTitle}>Vyberte avatar</ThemedText>
          <View style={styles.avatarsRow}>
            {AVATARS.map(avatar => (
              <Pressable
                key={avatar.id}
                onPress={() => {
                  setSelectedAvatar(avatar.id);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.avatarOption,
                  { backgroundColor: avatar.color },
                  selectedAvatar === avatar.id && styles.selectedAvatar,
                ]}
              >
                <Feather name={avatar.icon} size={24} color="#FFFFFF" />
                {selectedAvatar === avatar.id ? (
                  <View style={[styles.checkBadge, { backgroundColor: theme.success }]}>
                    <Feather name="check" size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Card>

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
              <Feather name="user" size={18} color={theme.textSecondary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Role</ThemedText>
              <ThemedText type="body">{user?.role === "ADMIN" ? "Trenérka" : "Klient"}</ThemedText>
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
    marginBottom: Spacing.xs,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  avatarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAvatar: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
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
