export const ROUTES = {
  // Tabs / primary
  HOME: "/(tabs)",
  MAP: "/(tabs)/map",
  BLOG: "/blog",
  SAVED: "/(tabs)/saved",
  POLICY: "/policy",
  CONTACT: "/contact",
  PROFILE: "/(tabs)/profile",

  // Auth
  LOGIN: "/(auth)/login",
  REGISTER: "/(auth)/register",
  FORGOT_PASSWORD: "/(auth)/forgot-password",

  // Room / listings
  ROOM: (id: string | number) => `/room/${id}`,
  COMPARE: "/room/compare",
  POST_ROOM: "/post-room",

  // Payments
  PRICING: "/pricing",
  CHECKOUT: "/checkout",
  PAYMENT_SUCCESS: "/payment-success",
  PAYMENT_FAILURE: "/payment-failure",

  // Dashboards
  USER_DASHBOARD: "/user-dashboard",
  LANDLORD_DASHBOARD: "/landlord-dashboard",
  ADMIN_DASHBOARD: "/admin-dashboard",

  // Landlord specific
  LANDLORD_PROPERTIES: (tab?: string) => `/landlord-dashboard?tab=posts`,
  LANDLORD_VERIFICATION: "/verification-service",
  LANDLORD_SETTINGS: "/settings",

  // Misc / demos
  EXPIRY_WARNING: "/expiry-warning-demo",
} as const;

export type RouteName = keyof typeof ROUTES;

/**
 * Helper to navigate using expo-router's `router` instance.
 * Usage: navigateTo(router, ROUTES.ROOM(123)) or navigateTo(router, ROUTES.MAP)
 */
export function navigateTo(router: any, path: string, replace = false) {
  if (replace && typeof router.replace === "function") {
    router.replace(path);
    return;
  }
  if (typeof router.push === "function") {
    router.push(path);
    return;
  }
  // fallback: try navigate if available
  if (typeof router.navigate === "function") {
    router.navigate(path);
  }
}

export default ROUTES;
