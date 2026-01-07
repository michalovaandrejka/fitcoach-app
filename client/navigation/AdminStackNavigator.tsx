import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Client } from "@/types";

import DashboardScreen from "@/screens/admin/DashboardScreen";
import ClientsScreen from "@/screens/admin/ClientsScreen";
import ClientDetailScreen from "@/screens/admin/ClientDetailScreen";
import CalendarScreen from "@/screens/admin/CalendarScreen";
import AvailabilityScreen from "@/screens/admin/AvailabilityScreen";
import AdminProfileScreen from "@/screens/admin/AdminProfileScreen";

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminClients: undefined;
  AdminClientDetail: { client: Client };
  AdminCalendar: undefined;
  AdminAvailability: undefined;
  AdminProfile: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AdminDashboard"
        component={DashboardScreen}
        options={{ headerTitle: "Dashboard" }}
      />
      <Stack.Screen
        name="AdminClients"
        component={ClientsScreen}
        options={{ headerTitle: "Klienti" }}
      />
      <Stack.Screen
        name="AdminClientDetail"
        component={ClientDetailScreen}
        options={({ route }) => ({
          headerTitle: route.params?.client?.name || "Detail klienta",
        })}
      />
      <Stack.Screen
        name="AdminCalendar"
        component={CalendarScreen}
        options={{ headerTitle: "Kalendář" }}
      />
      <Stack.Screen
        name="AdminAvailability"
        component={AvailabilityScreen}
        options={{ headerTitle: "Správa dostupnosti" }}
      />
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ headerTitle: "Profil" }}
      />
    </Stack.Navigator>
  );
}
