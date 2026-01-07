import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Spacing, BorderRadius } from "@/constants/theme";

import TrainingsScreen from "@/screens/client/TrainingsScreen";
import MealPlanScreen from "@/screens/client/MealPlanScreen";
import ProfileScreen from "@/screens/client/ProfileScreen";

export type ClientTabParamList = {
  Trainings: undefined;
  Booking: undefined;
  MealPlan: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ClientTabParamList>();

function BookingPlaceholder() {
  return null;
}

export default function ClientTabNavigator() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="Trainings"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        ...screenOptions,
      }}
    >
      <Tab.Screen
        name="Trainings"
        component={TrainingsScreen}
        options={{
          title: "Tréninky",
          headerTitle: "Tréninky",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingPlaceholder}
        options={{
          title: "Rezervace",
          tabBarIcon: ({ color, size }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("BookingModal");
              }}
              style={[styles.fabButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={24} color="#FFFFFF" />
            </Pressable>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("BookingModal");
          },
        }}
      />
      <Tab.Screen
        name="MealPlan"
        component={MealPlanScreen}
        options={{
          title: "Jídelníček",
          headerTitle: "Můj jídelníček",
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil",
          headerTitle: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
