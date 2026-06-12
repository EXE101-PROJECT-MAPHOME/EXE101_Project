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
import { BlogDetailPage } from "@/app/pages/BlogDetailPage";
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
import { MaintenancePage } from "@/app/pages/MaintenancePage";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AIChatAssistant } from "@/app/components/AIChatAssistant";
import { Toaster } from "@/app/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";

function RootLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await api.get("/api/settings/public");
        const isMaintenance = res.data?.maintenanceMode === true;

        if (isMaintenance) {
          const isAllowedPath = [
            "/login",
            "/admin/login",
            "/maintenance",
            "/register"
          ].includes(location.pathname);

          if (!isAllowedPath) {
            if (user) {
              if (user.role !== "admin") {
                navigate("/maintenance");
              }
            } else {
              navigate("/maintenance");
            }
          } else if (location.pathname === "/maintenance" && user?.role === "admin") {
            navigate("/admin/dashboard");
          }
        } else {
          if (location.pathname === "/maintenance") {
            navigate("/");
          }
        }
      } catch (err) {
        console.error("Maintenance check failed:", err);
      } finally {
        setChecking(false);
      }
    };

    checkMaintenance();
  }, [location.pathname, user, navigate]);

  if (checking && location.pathname !== "/maintenance" && location.pathname !== "/login" && location.pathname !== "/admin/login" && location.pathname !== "/register") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải...</p>
      </div>
    );
  }

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
      { path: "/blog/:id", Component: BlogDetailPage },
      { path: "/policy", Component: PolicyPage },
      { path: "/contact", Component: ContactPage },
      { path: "/login", Component: LoginPage },
      { path: "/forgot-password", Component: ForgotPasswordPage },
      { path: "/admin/login", Component: LoginPage },
      { path: "/admin/dashboard", Component: AdminPage },
      { path: "/landlord/dashboard", Component: LandlordDashboardV2 },
      { path: "/user/dashboard", Component: UserDashboard },
      { path: "/maintenance", Component: MaintenancePage },
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
