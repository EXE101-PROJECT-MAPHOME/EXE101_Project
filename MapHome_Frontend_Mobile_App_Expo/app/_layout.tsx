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
import { LogBox, Text, TextInput } from "react-native";
import AIChatAssistant from "../components/AIChatAssistant";

LogBox.ignoreLogs([
  "[Reanimated] Reduced motion setting is enabled on this device.",
  "ImagePicker.MediaTypeOptions have been deprecated", // Just in case any old dependency still triggers it
]);

// Prevent system accessibility font scaling from breaking layout designs across different devices
if ((Text as any).defaultProps) {
  (Text as any).defaultProps.allowFontScaling = false;
} else {
  (Text as any).defaultProps = {};
  (Text as any).defaultProps.allowFontScaling = false;
}

if ((TextInput as any).defaultProps) {
  (TextInput as any).defaultProps.allowFontScaling = false;
} else {
  (TextInput as any).defaultProps = {};
  (TextInput as any).defaultProps.allowFontScaling = false;
}

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
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
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
                  name="modal"
                  options={{ presentation: "modal", title: "Modal", headerShown: true }}
                />
              </Stack>
              <AIChatAssistant />
            </ThemeProvider>
          </CompareProvider>
        </PropertiesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

