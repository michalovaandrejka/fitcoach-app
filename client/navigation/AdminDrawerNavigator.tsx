import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps, useDrawerStatus } from "@react-navigation/drawer";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, DrawerActions } from "@react-navigation/native";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Client } from "@/types";

import DashboardScreen from "@/screens/admin/DashboardScreen";
import ClientsScreen from "@/screens/admin/ClientsScreen";
import ClientDetailScreen from "@/screens/admin/ClientDetailScreen";
import CalendarScreen from "@/screens/admin/CalendarScreen";
import AvailabilityScreen from "@/screens/admin/AvailabilityScreen";
import AdminProfileScreen from "@/screens/admin/AdminProfileScreen";
import LocationsScreen from "@/screens/admin/LocationsScreen";
import NotificationsScreen from "@/screens/admin/NotificationsScreen";
import MealPlansScreen from "@/screens/admin/MealPlansScreen";

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminClients: undefined;
  AdminClientDetail: { client: Client };
  AdminCalendar: undefined;
  AdminAvailability: undefined;
  AdminLocations: undefined;
  AdminNotifications: undefined;
  AdminMealPlans: undefined;
  AdminProfile: undefined;
};

export type AdminDrawerParamList = {
  DashboardStack: undefined;
  ClientsStack: undefined;
  CalendarStack: undefined;
  AvailabilityStack: undefined;
  NotificationsStack: undefined;
  MealPlansStack: undefined;
  LocationsStack: undefined;
  ProfileStack: undefined;
};

const Drawer = createDrawerNavigator<AdminDrawerParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

function DrawerMenuButton() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  return (
    <HeaderButton
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
    >
      <Feather name="menu" size={24} color={theme.text} />
    </HeaderButton>
  );
}

function useAdminScreenOptions() {
  const screenOptions = useScreenOptions();
  return {
    ...screenOptions,
    headerLeft: () => <DrawerMenuButton />,
  } as NativeStackNavigationOptions;
}

function DashboardStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={DashboardScreen} options={{ headerTitle: "Dashboard" }} />
      <Stack.Screen name="AdminClientDetail" component={ClientDetailScreen} options={({ route }) => ({ headerTitle: route.params?.client?.name || "Detail klienta", headerLeft: undefined })} />
    </Stack.Navigator>
  );
}

function ClientsStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminClients" component={ClientsScreen} options={{ headerTitle: "Klienti" }} />
      <Stack.Screen name="AdminClientDetail" component={ClientDetailScreen} options={({ route }) => ({ headerTitle: route.params?.client?.name || "Detail klienta", headerLeft: undefined })} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminCalendar" component={CalendarScreen} options={{ headerTitle: "Kalendar" }} />
    </Stack.Navigator>
  );
}

function AvailabilityStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminAvailability" component={AvailabilityScreen} options={{ headerTitle: "Dostupnost" }} />
    </Stack.Navigator>
  );
}

function LocationsStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminLocations" component={LocationsScreen} options={{ headerTitle: "Pobocky" }} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminNotifications" component={NotificationsScreen} options={{ headerTitle: "Oznameni" }} />
    </Stack.Navigator>
  );
}

function MealPlansStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminMealPlans" component={MealPlansScreen} options={{ headerTitle: "Jidelnicky" }} />
      <Stack.Screen name="AdminClientDetail" component={ClientDetailScreen} options={({ route }) => ({ headerTitle: route.params?.client?.name || "Detail klienta", headerLeft: undefined })} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const screenOptions = useAdminScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ headerTitle: "Profil" }} />
    </Stack.Navigator>
  );
}

type DrawerItem = {
  name: keyof AdminDrawerParamList;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const drawerItems: DrawerItem[] = [
  { name: "DashboardStack", label: "Dashboard", icon: "home" },
  { name: "ClientsStack", label: "Klienti", icon: "users" },
  { name: "CalendarStack", label: "Kalendar", icon: "calendar" },
  { name: "AvailabilityStack", label: "Dostupnost", icon: "clock" },
  { name: "NotificationsStack", label: "Oznameni", icon: "bell" },
  { name: "MealPlansStack", label: "Jidelnicky", icon: "clipboard" },
  { name: "LocationsStack", label: "Pobocky", icon: "map-pin" },
  { name: "ProfileStack", label: "Profil", icon: "user" },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const currentRoute = props.state.routes[props.state.index]?.name;

  return (
    <ThemedView style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="h2">FitCoach</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.name || user?.email}
          </ThemedText>
        </View>

        <View style={styles.menuItems}>
          {drawerItems.map((item) => {
            const isActive = currentRoute === item.name;
            return (
              <Pressable
                key={item.name}
                onPress={() => props.navigation.navigate(item.name)}
                style={[
                  styles.menuItem,
                  { backgroundColor: isActive ? theme.primary + "20" : "transparent" },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? theme.primary : theme.text}
                />
                <ThemedText
                  style={[
                    styles.menuLabel,
                    { color: isActive ? theme.primary : theme.text },
                  ]}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, borderTopColor: theme.border }]}>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color={theme.error} />
          <ThemedText style={[styles.logoutText, { color: theme.error }]}>
            Odhlasit se
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export default function AdminDrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.backgroundRoot,
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="DashboardStack" component={DashboardStack} />
      <Drawer.Screen name="ClientsStack" component={ClientsStack} />
      <Drawer.Screen name="CalendarStack" component={CalendarStack} />
      <Drawer.Screen name="AvailabilityStack" component={AvailabilityStack} />
      <Drawer.Screen name="NotificationsStack" component={NotificationsStack} />
      <Drawer.Screen name="MealPlansStack" component={MealPlansStack} />
      <Drawer.Screen name="LocationsStack" component={LocationsStack} />
      <Drawer.Screen name="ProfileStack" component={ProfileStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerScroll: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  menuItems: {
    paddingHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  menuLabel: {
    marginLeft: Spacing.lg,
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: "500",
  },
});
