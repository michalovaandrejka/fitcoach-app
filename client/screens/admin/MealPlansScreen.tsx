import React, { useState, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { getClients, getTrainerMealPlan, getMealPreference } from "@/lib/storage";
import { Client, TrainerMealPlan, MealPreference } from "@/types";

interface ClientMealInfo {
  client: Client;
  mealPlan: TrainerMealPlan | null;
  preferences: MealPreference | null;
}

export default function MealPlansScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  
  const [clientMealInfos, setClientMealInfos] = useState<ClientMealInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const clients = await getClients();
    const infos: ClientMealInfo[] = await Promise.all(
      clients.map(async (client) => {
        const [mealPlan, preferences] = await Promise.all([
          getTrainerMealPlan(client.id),
          getMealPreference(client.id),
        ]);
        return { client, mealPlan, preferences };
      })
    );
    setClientMealInfos(infos);
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

  const handleClientPress = (client: Client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AdminClientDetail", { client });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const getStatusInfo = (info: ClientMealInfo) => {
    if (info.mealPlan) {
      return {
        icon: "check-circle" as const,
        color: theme.success,
        text: `Aktualizovano ${formatDate(info.mealPlan.updatedAt)}`,
      };
    }
    if (info.preferences) {
      return {
        icon: "alert-circle" as const,
        color: theme.warning,
        text: "Preference vyplneny, ceka na jidelnicek",
      };
    }
    return {
      icon: "x-circle" as const,
      color: theme.textSecondary,
      text: "Bez preferencii a jidelnicku",
    };
  };

  const renderItem = ({ item }: { item: ClientMealInfo }) => {
    const status = getStatusInfo(item);
    
    return (
      <Card 
        elevation={1} 
        style={styles.card}
        onPress={() => handleClientPress(item.client)}
      >
        <View style={styles.cardContent}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {getInitials(item.client.name)}
            </ThemedText>
          </View>
          <View style={styles.info}>
            <ThemedText type="h4">{item.client.name}</ThemedText>
            <View style={styles.statusRow}>
              <Feather name={status.icon} size={14} color={status.color} />
              <ThemedText type="small" style={{ color: status.color, marginLeft: Spacing.xs }}>
                {status.text}
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>
    );
  };

  const clientsWithPlan = clientMealInfos.filter(i => i.mealPlan);
  const clientsWaiting = clientMealInfos.filter(i => !i.mealPlan && i.preferences);
  const clientsNone = clientMealInfos.filter(i => !i.mealPlan && !i.preferences);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={clientMealInfos}
        renderItem={renderItem}
        keyExtractor={(item) => item.client.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: theme.success + "20" }]}>
                <ThemedText type="body" style={{ color: theme.success, fontWeight: "600" }}>
                  {clientsWithPlan.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.success }}>
                  s jidelnickem
                </ThemedText>
              </View>
              <View style={[styles.statBadge, { backgroundColor: theme.warning + "20" }]}>
                <ThemedText type="body" style={{ color: theme.warning, fontWeight: "600" }}>
                  {clientsWaiting.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.warning }}>
                  ceka na plan
                </ThemedText>
              </View>
              <View style={[styles.statBadge, { backgroundColor: theme.textSecondary + "20" }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                  {clientsNone.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  bez dat
                </ThemedText>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
              Zatim zadni klienti
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statBadge: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    alignItems: "center",
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
});
