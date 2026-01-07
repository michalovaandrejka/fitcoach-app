import React, { useState } from "react";
import { ActivityIndicator, View, StyleSheet, Modal } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ClientTabNavigator from "@/navigation/ClientTabNavigator";
import AdminDrawerNavigator from "@/navigation/AdminDrawerNavigator";
import LoginScreen from "@/screens/LoginScreen";
import BookingScreen from "@/screens/client/BookingScreen";
import { Onboarding } from "@/components/Onboarding";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Login: undefined;
  ClientMain: undefined;
  AdminMain: undefined;
  BookingModal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading, isAuthenticated, needsOnboarding } = useAuth();
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const shouldShowOnboarding = isAuthenticated && needsOnboarding && showOnboarding;

  return (
    <>
      <Stack.Navigator screenOptions={screenOptions}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : user?.role === "ADMIN" ? (
          <Stack.Screen
            name="AdminMain"
            component={AdminDrawerNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="ClientMain"
              component={ClientTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookingModal"
              component={BookingScreen}
              options={{
                presentation: "modal",
                headerTitle: "Rezervace treninku",
              }}
            />
          </>
        )}
      </Stack.Navigator>

      {shouldShowOnboarding ? (
        <Modal visible animationType="slide" presentationStyle="fullScreen">
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
