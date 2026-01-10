import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, Linking, ActivityIndicator } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiDeleteUser } from "@/lib/api";

const AVATARS = [
  { id: 1, icon: "user" as const, color: "#FF6B35" },
  { id: 2, icon: "activity" as const, color: "#4CAF50" },
  { id: 3, icon: "heart" as const, color: "#E91E63" },
  { id: 4, icon: "zap" as const, color: "#9C27B0" },
];

interface TrainerContact {
  id: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  updatedAt: string;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  
  const [selectedAvatar, setSelectedAvatar] = useState(1);

  const { data: trainerContact, isLoading: isLoadingContact } = useQuery<TrainerContact | null>({
    queryKey: ["/api/trainer-contact"],
  });

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Smazat účet",
      "Opravdu chcete smazat svůj účet? Tato akce je nevratná a vše bude smazáno.",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Ano, smazat",
          style: "destructive",
          onPress: async () => {
            if (user?.id) {
              try {
                await apiDeleteUser(user.id);
                await logout();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                Alert.alert("Chyba", "Nepodařilo se smazat účet. Zkuste to prosím znovu.");
              }
            }
          },
        },
      ]
    );
  };

  const handlePhonePress = async () => {
    if (trainerContact?.phone) {
      const phoneNumber = trainerContact.phone.replace(/\s/g, "");
      const url = `tel:${phoneNumber}`;
      try {
        await Linking.openURL(url);
        Haptics.selectionAsync();
      } catch (error) {
        Alert.alert("Chyba", "Nepodařilo se otevřít aplikaci pro volání.");
      }
    }
  };

  const handleEmailPress = async () => {
    if (trainerContact?.email) {
      const url = `mailto:${trainerContact.email}`;
      try {
        await Linking.openURL(url);
        Haptics.selectionAsync();
      } catch (error) {
        Alert.alert("Chyba", "Nepodařilo se otevřít emailovou aplikaci.");
      }
    }
  };

  const handleWhatsAppPress = async () => {
    if (trainerContact?.whatsapp) {
      const phoneNumber = trainerContact.whatsapp.replace(/[^0-9+]/g, "").replace("+", "");
      const url = `https://wa.me/${phoneNumber}`;
      try {
        await Linking.openURL(url);
        Haptics.selectionAsync();
      } catch (error) {
        Alert.alert("Chyba", "Nepodařilo se otevřít WhatsApp.");
      }
    }
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
          <ThemedText type="h4" style={styles.sectionTitle}>Kontakt na trenérku</ThemedText>
          
          {isLoadingContact ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : trainerContact ? (
            <>
              <Pressable onPress={handlePhonePress} style={styles.contactRow}>
                <View style={[styles.contactIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="phone" size={18} color={theme.primary} />
                </View>
                <View style={styles.contactContent}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Telefon</ThemedText>
                  <ThemedText type="body" style={{ color: theme.primary }}>{trainerContact.phone}</ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>

              {trainerContact.email ? (
                <Pressable onPress={handleEmailPress} style={styles.contactRow}>
                  <View style={[styles.contactIcon, { backgroundColor: theme.primary + "20" }]}>
                    <Feather name="mail" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.contactContent}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Email</ThemedText>
                    <ThemedText type="body" style={{ color: theme.primary }}>{trainerContact.email}</ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}

              {trainerContact.whatsapp ? (
                <Pressable onPress={handleWhatsAppPress} style={styles.contactRow}>
                  <View style={[styles.contactIcon, { backgroundColor: "#25D366" + "20" }]}>
                    <Feather name="message-circle" size={18} color="#25D366" />
                  </View>
                  <View style={styles.contactContent}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>WhatsApp</ThemedText>
                    <ThemedText type="body" style={{ color: "#25D366" }}>{trainerContact.whatsapp}</ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </>
          ) : (
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Kontaktní údaje nejsou k dispozici.
            </ThemedText>
          )}
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
          style={[styles.logoutButton, { borderColor: theme.textSecondary }]}
        >
          <Feather name="log-out" size={20} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
            Odhlásit se
          </ThemedText>
        </Pressable>

        <View style={styles.dangerZone}>
          <ThemedText type="small" style={{ color: theme.error, marginBottom: Spacing.md, textAlign: "center" }}>
            Nebezpečná zóna
          </ThemedText>
          <Pressable
            onPress={handleDeleteAccount}
            style={[styles.deleteButton, { borderColor: theme.error }]}
          >
            <Feather name="trash-2" size={20} color={theme.error} />
            <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
              Smazat účet
            </ThemedText>
          </Pressable>
        </View>
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  contactContent: {
    flex: 1,
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
  dangerZone: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
