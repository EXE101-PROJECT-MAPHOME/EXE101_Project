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
  Menu,
  X as XIcon,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleBadge } from "@/app/components/RoleBadge";
import NotificationCenter from "@/app/components/NotificationCenter";

export function Navbar() {
  const apkUrl = "https://expo.dev/accounts/dang_thanh_tu/projects/maphome/builds/86ebb301-1ccf-4ef5-a89c-38c822e7e70d";
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      } else if (user.role === "broker") {
        navigate("/broker/dashboard");
      } else {
        // For regular users, go to user dashboard
        navigate("/user/dashboard");
      }
    } else {
      navigate("/login");
    }
  };

  const navItems = [
    { path: "/", label: "Trang chủ", icon: Home },
    { path: "/map", label: "Tìm trọ", icon: MapPin },
    { path: "/blog", label: "Blog", icon: MessageCircle },
    { path: "/policy", label: "Chính sách", icon: FileText },
    { path: "/contact", label: "Liên hệ", icon: Mail },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-lg py-1.5 sm:py-2"
            : "bg-white/90 backdrop-blur-md shadow-sm py-2 sm:py-3 border-b"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            {/* Logo */}
            <div
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white shadow-md border border-gray-100/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5">
                <img
                  src="/images/MapHome_logo_2.png"
                  alt="MapHome Logo"
                  className="w-[120%] h-[120%] object-cover"
                />
              </div>
              <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-br from-emerald-950 via-green-800 to-emerald-600 bg-clip-text text-transparent tracking-tighter group-hover:opacity-80 transition-opacity hidden sm:block">
                MapHome
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Button
                  key={path}
                  variant={isActive(path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(path)}
                  className={isActive(path) ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Icon className="size-3.5 lg:size-4 mr-1" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              ))}

              {/* Tải App APK Button */}
              <div className="relative ml-1 hidden lg:block">
                <Button variant="ghost" size="sm" onClick={() => navigate("/download")} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Download className="size-3.5 lg:size-4 mr-1" />
                  <span>Tải App APK</span>
                </Button>
              </div>

              {isAuthenticated && (user?.role === "landlord" || user?.role === "broker") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/post-room")}
                    className="ml-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 bg-white"
                  >
                    <PenSquare className="size-3.5 lg:size-4 mr-1" />
                    <span className="hidden lg:inline">Đăng tin trọ</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/pricing")}
                    className="ml-1 border-blue-500 text-blue-600 hover:bg-blue-50 bg-white"
                  >
                    <UserPlus className="size-3.5 lg:size-4 mr-1" />
                    <span className="hidden lg:inline">Nâng cấp gói</span>
                  </Button>
                </>
              )}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                    className="relative group overflow-hidden px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-lg will-change-transform hidden sm:flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                  >
                    <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-[30deg] -translate-x-[150%] group-hover:translate-x-[400%] transition-transform duration-700 ease-in-out will-change-transform" />
                    <User className="size-3.5 sm:size-4 shrink-0" />
                    <span className="hidden sm:inline">Đăng nhập</span>
                    <span className="sm:hidden">Nhập</span>
                  </motion.button>
                </>
              ) : (
                <>
                  {/* Desktop User Section */}
                  <div className="hidden sm:flex items-center gap-3">
                    <NotificationCenter />
                    <div
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] flex items-center justify-center text-white text-xs lg:text-sm font-bold shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-all"
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
                    <div className="hidden lg:block">
                      <span className="text-xs text-gray-600">
                        <strong className="text-xs lg:text-sm text-gray-900 block leading-tight line-clamp-1">
                          {user?.fullName || user?.username}
                        </strong>
                      </span>
                      <div onClick={handleUserAction} className="cursor-pointer">
                        <RoleBadge
                          role={(user?.role as any) || "user"}
                          showIcon={true}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                    >
                      <LogOut className="size-3.5 lg:size-4" />
                    </Button>
                  </div>

                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              >
                {mobileMenuOpen ? (
                  <XIcon className="size-5 text-gray-700" />
                ) : (
                  <Menu className="size-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-3 w-[260px] bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl sm:hidden z-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            <div className="px-2 py-2 space-y-1.5">
              {/* User Info */}
              {isAuthenticated && user && (
              <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full border-2 border-green-600 overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar) || ""}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user?.fullName, user?.username)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">
                    {user?.fullName || user?.username}
                  </p>
                  <RoleBadge role={(user?.role as any) || "user"} showIcon={false} />
                </div>
              </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black transition-all ${
                      isActive(path)
                        ? "bg-green-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="size-5 flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}

                {isAuthenticated && (user?.role === "landlord" || user?.role === "broker") && (
                  <>
                    <button
                      onClick={() => {
                        navigate("/post-room");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black transition-all text-emerald-600 bg-emerald-50 hover:bg-emerald-100 mt-2"
                    >
                      <PenSquare className="size-5 flex-shrink-0" />
                      <span>Đăng tin trọ</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/pricing");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black transition-all text-blue-600 bg-blue-50 hover:bg-blue-100 mt-1"
                    >
                      <UserPlus className="size-5 flex-shrink-0" />
                      <span>Nâng cấp gói</span>
                    </button>
                  </>
                )}

                {/* Mobile Download APK Link */}
                <button
                  onClick={() => {
                    navigate("/download");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-black text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-md shadow-emerald-500/20 active:scale-95 transition-all mt-3"
                >
                  <Download className="size-4 flex-shrink-0" />
                  <span>Tải Ứng Dụng MapHome APK</span>
                </button>
              </div>

              {/* User Actions */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        handleUserAction();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <User className="size-5 flex-shrink-0" />
                      <span>Tài khoản</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="size-5 flex-shrink-0" />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-black text-white bg-green-600 shadow-md hover:bg-green-700 transition-all"
                  >
                    <User className="size-5 flex-shrink-0" />
                    <span>Đăng nhập ngay</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
