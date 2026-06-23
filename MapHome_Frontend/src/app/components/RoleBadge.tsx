import { motion } from "framer-motion";
import { User, ShieldCheck, Home } from "lucide-react";

interface RoleBadgeProps {
  role: "admin" | "landlord" | "user" | "broker";
  className?: string;
  showIcon?: boolean;
}

export function RoleBadge({ role, className = "", showIcon = true }: RoleBadgeProps) {
  const configs = {
    admin: {
      label: "Quản trị viên",
      gradient: "from-indigo-600 to-purple-600",
      bg: "bg-indigo-50/50",
      border: "border-indigo-100",
      text: "text-indigo-700",
      icon: <ShieldCheck className="size-3" />,
      shadow: "shadow-indigo-100",
    },
    landlord: {
      label: "Chủ trọ",
      gradient: "from-emerald-600 to-teal-600",
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      icon: <Home className="size-3" />,
      shadow: "shadow-emerald-100",
    },
    user: {
      label: "Người thuê",
      gradient: "from-blue-600 to-sky-500",
      bg: "bg-blue-50/50",
      border: "border-blue-100",
      text: "text-blue-700",
      icon: <User className="size-3" />,
      shadow: "shadow-blue-100",
    },
    broker: {
      label: "Môi giới",
      gradient: "from-amber-600 to-orange-600",
      bg: "bg-amber-50/50",
      border: "border-amber-100",
      text: "text-amber-700",
      icon: <User className="size-3" />,
      shadow: "shadow-amber-100",
    },
  };

  const config = configs[role] || configs.user;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -2, 
        scale: 1.05,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.5
      }}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
        ${config.bg} ${config.border} border backdrop-blur-[2px]
        shadow-sm ${config.shadow}
        relative group overflow-hidden
        cursor-pointer
        will-change-transform will-change-[box-shadow]
        ${className}
      `}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-[30deg] -translate-x-[200%] group-hover:translate-x-[300%] transition-transform duration-700 ease-in-out will-change-transform" />

      {showIcon && (
        <span className={`p-1 rounded-full bg-white shadow-md will-change-transform transition-transform duration-300 group-hover:rotate-12 ${config.text} flex items-center justify-center`}>
          {config.icon}
        </span>
      )}
      <span className={`
        text-[10px] font-black uppercase tracking-[0.15em]
        bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent
        relative z-10 select-none
      `}>
        {config.label}
      </span>
    </motion.div>



  );
}
