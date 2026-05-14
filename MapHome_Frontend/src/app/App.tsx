import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { CompareProvider } from "@/app/contexts/CompareContext";
import { PropertiesProvider } from "@/app/contexts/PropertiesContext";
import { VerificationProvider } from "@/app/contexts/VerificationContext";
import { HomePage } from "@/app/pages/HomePage";
import { MapPage } from "@/app/pages/MapPage";
import { RegisterPage } from "@/app/pages/RegisterPage";
import { PostRoomPage } from "@/app/pages/PostRoomPage";
import { BlogPage } from "@/app/pages/BlogPage";
import { PolicyPage } from "@/app/pages/PolicyPage";
import { ContactPage } from "@/app/pages/ContactPage";
import { LoginPage } from "@/app/pages/LoginPage";
import { ForgotPasswordPage } from "@/app/pages/ForgotPasswordPage";
import { AdminPage } from "@/app/pages/AdminPage";
import { LandlordDashboardV2 } from "@/app/pages/LandlordDashboardV2";
import { UserDashboard } from "@/app/pages/UserDashboard";
import { RoomDetailPage } from "@/app/pages/RoomDetailPage";
import { ComparePage } from "@/app/pages/ComparePage";
import { PricingPage } from "@/app/pages/PricingPage";
import { CheckoutPage } from "@/app/pages/CheckoutPage";
import { PaymentSuccessPage } from "@/app/pages/PaymentSuccessPage";
import { PaymentFailurePage } from "@/app/pages/PaymentFailurePage";
import { ExpiryWarningDemo } from "@/app/pages/ExpiryWarningDemo";
import { Outlet } from "react-router-dom";
import { AIChatAssistant } from "@/app/components/AIChatAssistant";
import { Toaster } from "@/app/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";

function RootLayout() {
  return (
    <>
      <Outlet />
      <AIChatAssistant />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "/", Component: HomePage },
      { path: "/map", Component: MapPage },
      { path: "/room/:id", Component: RoomDetailPage },
      { path: "/compare", Component: ComparePage },
      { path: "/pricing", Component: PricingPage },
      { path: "/checkout", Component: CheckoutPage },
      { path: "/payment-success", Component: PaymentSuccessPage },
      { path: "/payment-failure", Component: PaymentFailurePage },
      { path: "/expiry-warning-demo", Component: ExpiryWarningDemo },
      { path: "/register", Component: RegisterPage },
      { path: "/post-room", Component: PostRoomPage },
      { path: "/blog", Component: BlogPage },
      { path: "/policy", Component: PolicyPage },
      { path: "/contact", Component: ContactPage },
      { path: "/login", Component: LoginPage },
      { path: "/forgot-password", Component: ForgotPasswordPage },
      { path: "/admin/login", Component: LoginPage },
      { path: "/admin/dashboard", Component: AdminPage },
      { path: "/landlord/dashboard", Component: LandlordDashboardV2 },
      { path: "/user/dashboard", Component: UserDashboard },
    ]
  }
]);

export default function App() {
  return (
    <AuthProvider>
      <PropertiesProvider>
        <VerificationProvider>
          <CompareProvider>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RouterProvider router={router} />
              </motion.div>
            </AnimatePresence>
            <Toaster position="top-center" richColors />
          </CompareProvider>
        </VerificationProvider>
      </PropertiesProvider>
    </AuthProvider>
  );
}
