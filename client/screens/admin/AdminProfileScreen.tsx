import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Alert, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface TrainerContact {
  id: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
  updatedAt: string;
}

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: contact, isLoading } = useQuery<TrainerContact | null>({
    queryKey: ["/api/trainer-contact"],
  });

  useEffect(() => {
    if (contact) {
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setWhatsapp(contact.whatsapp || "");
    }
  }, [contact]);

  const saveContactMutation = useMutation({
    mutationFn: async (data: { phone: string; email: string | null; whatsapp: string | null }) => {
      return apiRequest("PUT", "/api/trainer-contact", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer-contact"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Úspěch", "Kontaktní údaje byly uloženy.");
    },
    onError: () => {
      Alert.alert("Chyba", "Nepodařilo se uložit kontaktní údaje.");
    },
  });

  const handleSaveContact = async () => {
    if (!phone.trim()) {
      Alert.alert("Chyba", "Telefon je povinný údaj.");
      return;
    }
    setIsSaving(true);
    try {
      await saveContactMutation.mutateAsync({
        phone: phone.trim(),
        email: email.trim() || null,
        whatsapp: whatsapp.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          <ThemedText type="h4" style={styles.sectionTitle}>Kontaktní údaje pro klienty</ThemedText>
          
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Feather name="phone" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    Telefon *
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+420 XXX XXX XXX"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Feather name="mail" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    Email (nepovinné)
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vas@email.cz"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Feather name="message-circle" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                    WhatsApp (nepovinné)
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="+420 XXX XXX XXX"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <Pressable
                onPress={handleSaveContact}
                disabled={isSaving}
                style={[styles.saveButton, { backgroundColor: theme.primary, opacity: isSaving ? 0.7 : 1 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="save" size={18} color="#FFFFFF" />
                    <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}>
                      Uložit kontakt
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </>
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
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
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
