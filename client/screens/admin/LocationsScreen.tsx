import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Pressable, TextInput, Modal } from "react-native";
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
import { getLocations, updateLocation, addLocation } from "@/lib/storage";
import { Location } from "@/types";

export default function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const loadData = async () => {
    const locs = await getLocations();
    setLocations(locs);
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

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setEditName(location.name);
    setEditAddress(location.address);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (editingLocation && editName.trim()) {
      await updateLocation(editingLocation.id, {
        name: editName.trim(),
        address: editAddress.trim(),
      });
      await loadData();
      setEditingLocation(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleToggleActive = async (location: Location) => {
    await updateLocation(location.id, { isActive: !location.isActive });
    await loadData();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddLocation = async () => {
    if (newName.trim() && newAddress.trim()) {
      await addLocation(newName.trim(), newAddress.trim());
      await loadData();
      setShowAddModal(false);
      setNewName("");
      setNewAddress("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const LocationCard = ({ location }: { location: Location }) => (
    <Card elevation={1} style={{ ...styles.locationCard, ...(!location.isActive ? styles.inactiveCard : {}) }}>
      <View style={styles.locationHeader}>
        <View style={[styles.statusDot, { backgroundColor: location.isActive ? theme.success : theme.textSecondary }]} />
        <View style={styles.locationInfo}>
          <ThemedText type="h4" style={!location.isActive ? { color: theme.textSecondary } : undefined}>
            {location.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {location.address}
          </ThemedText>
        </View>
      </View>
      <View style={styles.locationActions}>
        <Pressable
          onPress={() => handleEdit(location)}
          style={[styles.actionButton, { backgroundColor: theme.primary + "20" }]}
        >
          <Feather name="edit-2" size={18} color={theme.primary} />
        </Pressable>
        <Pressable
          onPress={() => handleToggleActive(location)}
          style={[styles.actionButton, { backgroundColor: location.isActive ? theme.error + "20" : theme.success + "20" }]}
        >
          <Feather 
            name={location.isActive ? "eye-off" : "eye"} 
            size={18} 
            color={location.isActive ? theme.error : theme.success} 
          />
        </Pressable>
      </View>
    </Card>
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
          <ThemedText type="h3">Sprava pobocek</ThemedText>
          <Pressable
            onPress={() => {
              setShowAddModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {locations.map(location => (
          <LocationCard key={location.id} location={location} />
        ))}
      </ScrollView>

      <Modal
        visible={editingLocation !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingLocation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>Upravit pobocku</ThemedText>
            
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Nazev
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nazev pobocky"
              placeholderTextColor={theme.textSecondary}
            />
            
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Adresa
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Adresa pobocky"
              placeholderTextColor={theme.textSecondary}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setEditingLocation(null)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText>Zrusit</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>Ulozit</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>Pridat pobocku</ThemedText>
            
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Nazev
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nazev pobocky"
              placeholderTextColor={theme.textSecondary}
            />
            
            <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Adresa
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Adresa pobocky"
              placeholderTextColor={theme.textSecondary}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setNewName("");
                  setNewAddress("");
                }}
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText>Zrusit</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleAddLocation}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>Pridat</ThemedText>
              </Pressable>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  locationCard: {
    marginBottom: Spacing.md,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
});
