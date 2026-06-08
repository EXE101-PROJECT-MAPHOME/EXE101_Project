import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

cssInterop(LinearGradient, {
  className: "style",
});

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "../contexts/AuthContext";
import { PropertiesProvider } from "../contexts/PropertiesContext";
import { CompareProvider } from "../contexts/CompareContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PropertiesProvider>
          <CompareProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                  }}
                  listeners={({ navigation }) => ({
                    beforeRemove: (e) => {
                      // Prevent back action on tabs screen
                      e.preventDefault();
                    },
                  })}
                />
                <Stack.Screen name="blog" options={{ headerShown: false }} />
                <Stack.Screen name="contact" options={{ headerShown: false }} />
                <Stack.Screen name="policy" options={{ headerShown: false }} />
                <Stack.Screen
                  name="user-dashboard"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="landlord-dashboard"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="admin-dashboard"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
            </ThemeProvider>
          </CompareProvider>
        </PropertiesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

