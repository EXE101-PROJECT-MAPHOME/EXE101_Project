import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/contexts/AuthContext";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { Button } from "@/app/components/ui/button";
import {
  Home,
  MapPin,
  UserPlus,
  PenSquare,
  MessageCircle,
  FileText,
  Mail,
  User,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleBadge } from "@/app/components/RoleBadge";
import NotificationCenter from "@/app/components/NotificationCenter";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleUserAction = () => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "landlord") {
        navigate("/landlord/dashboard");
      } else {
        // For regular users, go to user dashboard
        navigate("/user/dashboard");
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-lg shadow-lg py-2"
          : "bg-white/90 backdrop-blur-md shadow-sm py-3 border-b"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img 
              src="/images/MapHome_logo.jpg" 
              alt="MapHome Logo" 
              className="h-10 w-auto object-contain mix-blend-multiply hover:scale-105 transition-transform" 
            />
            <h1 className="text-xl font-black text-emerald-950 tracking-tight">
              MapHome
            </h1>
          </div>

          {/* Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
              className={isActive("/") ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Home className="size-4 mr-1.5" />
              Trang chủ
            </Button>

            <Button
              variant={isActive("/map") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/map")}
              className={
                isActive("/map") ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              <MapPin className="size-4 mr-1.5" />
              Tìm trọ
            </Button>

            <Button
              variant={isActive("/blog") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/blog")}
              className={
                isActive("/blog") ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              <MessageCircle className="size-4 mr-1.5" />
              Blog
            </Button>

            <Button
              variant={isActive("/policy") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/policy")}
              className={
                isActive("/policy") ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              <FileText className="size-4 mr-1.5" />
              Chính sách
            </Button>

            <Button
              variant={isActive("/contact") ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/contact")}
              className={
                isActive("/contact") ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              <Mail className="size-4 mr-1.5" />
              Liên hệ
            </Button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 15px 30px -10px rgba(16, 185, 129, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => navigate("/login")}
                  className="relative group overflow-hidden px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl text-sm font-black shadow-lg will-change-transform flex items-center gap-2"
                >
                  <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-[30deg] -translate-x-[150%] group-hover:translate-x-[400%] transition-transform duration-700 ease-in-out will-change-transform" />
                  <User className="size-4 shrink-0" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </motion.button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <NotificationCenter />
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] flex items-center justify-center text-white text-sm font-bold shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                    onClick={handleUserAction}
                  >
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar) || ""}
                        alt="Avatar"
                        className="w-full h-full object-cover rendering-pixelated"
                        style={{ imageRendering: "-webkit-optimize-contrast" }}
                      />
                    ) : (
                      getInitials(user?.fullName, user?.username)
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    <strong className="text-sm text-gray-900 block leading-tight">
                      {user?.fullName || user?.username}
                    </strong>
                  </span>
                  <div onClick={handleUserAction} className="cursor-pointer">
                    <RoleBadge
                      role={(user?.role as any) || "user"}
                      showIcon={true}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
                {/* Mobile - Show user button */}
                <div className="flex items-center gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUserAction}
                  >
                    <User className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center gap-1 mt-3 overflow-x-auto pb-1">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className={isActive("/") ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Home className="size-3.5 mr-1" />
            <span className="text-xs">Trang chủ</span>
          </Button>

          <Button
            variant={isActive("/map") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/map")}
            className={
              isActive("/map") ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <MapPin className="size-3.5 mr-1" />
            <span className="text-xs">Tìm trọ</span>
          </Button>

          <Button
            variant={isActive("/blog") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/blog")}
            className={
              isActive("/blog") ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <MessageCircle className="size-3.5 mr-1" />
            <span className="text-xs">Blog</span>
          </Button>

          <Button
            variant={isActive("/policy") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/policy")}
            className={
              isActive("/policy") ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <FileText className="size-3.5 mr-1" />
            <span className="text-xs">Chính sách</span>
          </Button>

          <Button
            variant={isActive("/contact") ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/contact")}
            className={
              isActive("/contact") ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <Mail className="size-3.5 mr-1" />
            <span className="text-xs">Liên hệ</span>
          </Button>
        </nav>
      </div>
    </motion.header>
  );
}
