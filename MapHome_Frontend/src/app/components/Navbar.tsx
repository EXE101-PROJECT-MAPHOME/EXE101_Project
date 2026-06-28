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
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              >
                <Menu className="size-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[240px] bg-white z-50 flex flex-col md:hidden overflow-hidden shadow-2xl"
            >
              <div className="p-2 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate("/"); setMobileMenuOpen(false); }}>
                  <img src="/images/MapHome_logo_2.png" alt="MapHome Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-gray-100" />
                  <span className="font-black text-emerald-700 text-lg tracking-tighter">MapHome</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <XIcon className="size-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                      isActive(path)
                        ? "bg-green-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="size-[18px] flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}

                {isAuthenticated && (user?.role === "landlord" || user?.role === "broker") && (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    <button
                      onClick={() => {
                        navigate("/post-room");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-bold transition-all text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    >
                      <PenSquare className="size-[18px] flex-shrink-0" />
                      <span>Đăng tin trọ</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/pricing");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-bold transition-all text-blue-600 bg-blue-50 hover:bg-blue-100"
                    >
                      <UserPlus className="size-[18px] flex-shrink-0" />
                      <span>Nâng cấp gói</span>
                    </button>
                  </>
                )}
              </div>

              {/* Account Card at Bottom */}
              <div className="p-2 border-t border-gray-100 bg-gray-50/50 mt-auto w-full box-border">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-2 w-full">
                    {/* User Info */}
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className="w-[30px] h-[30px] rounded-full border border-green-200 overflow-hidden bg-gradient-to-br from-[#16a34a] to-[#0ea5e9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
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
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[13px] font-black text-gray-900 truncate leading-tight w-full">
                          {user?.fullName || user?.username}
                        </p>
                        <div className="text-[10px] truncate w-full -mt-0.5">
                           <RoleBadge role={(user?.role as any) || "user"} showIcon={false} />
                        </div>
                      </div>
                    </div>
                    {/* 2 Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={() => {
                          handleUserAction();
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 flex justify-center items-center gap-1 py-1.5 px-1 bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm truncate"
                      >
                        <Home className="size-3.5 shrink-0" />
                        <span className="truncate">Trang chủ</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                          setMobileMenuOpen(false);
                        }}
                        className="flex-1 flex justify-center items-center gap-1 py-1.5 px-1 bg-red-50 border border-red-100 rounded text-[11px] font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm truncate"
                      >
                        <LogOut className="size-3.5 shrink-0" />
                        <span className="truncate">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[12px] font-black text-white bg-green-600 shadow-md hover:bg-green-700 transition-all"
                  >
                    <User className="size-4 shrink-0" />
                    <span>Đăng nhập ngay</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
