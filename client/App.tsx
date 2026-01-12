import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Feather } from "@expo/vector-icons";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeData } from "@/lib/storage";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        console.log("[App] Loading Feather fonts...");
        await Font.loadAsync({
          ...Feather.font,
        });
        console.log("[App] Feather fonts loaded successfully");
        setFontsLoaded(true);
      } catch (e) {
        console.error("[App] Error loading fonts:", e);
        setFontsLoaded(true);
      }
    };
    
    loadFonts();
  }, []);

  useEffect(() => {
    const prepare = async () => {
      if (!fontsLoaded) return;
      
      try {
        console.log("[App] Hiding splash screen...");
        await SplashScreen.hideAsync();
        console.log("[App] Splash screen hidden");
      } catch (e) {
        console.warn("[App] Error hiding splash:", e);
      }
      
      setAppReady(true);
      
      try {
        await initializeData();
        console.log("[App] Data initialized");
      } catch (e) {
        console.warn("[App] Error initializing data:", e);
      }
    };
    
    prepare();
  }, [fontsLoaded]);

  if (!appReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer>
                  <RootStackNavigator />
                </NavigationContainer>
                <StatusBar style="auto" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundRoot,
  },
});
