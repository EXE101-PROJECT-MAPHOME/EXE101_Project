import { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  Phone,
  Mail,
  ShieldAlert,
  Bell,
  Save,
  RotateCcw,
  Info,
  Layers,
  Edit2,
  Trash2,
  User,
  Camera,
  Key,
  ChevronRight,
  CheckCircle,
  Layout,
  FileText,
  Activity,
  Plus,
  Clock,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/utils/api";
import { getAvatarUrl, getInitials } from "@/app/utils/avatarUtils";
import { useNavigate } from "react-router-dom";

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "general" | "broadcast" | "banners" | "seo" | "policies" | "automation" | "account"
  >("general");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/settings");
      if (res.status === 200) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put("/api/admin/settings", settings);
      if (res.status === 200) {
        toast.success("Cài đặt hệ thống đã được cập nhật! ✨");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUpdatingAvatar(true);
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await api.post("/api/upload/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.status === 201) {
        const imageUrl = uploadRes.data.url;
        const userId = user?.id || (user as any)?._id;
        const updateRes = await api.put(`/api/user/${userId}`, {
          avatar: imageUrl,
        });

        if (updateRes.status === 200) {
          updateUser(updateRes.data);
          toast.success("Cập nhật ảnh đại diện thành công! ✨");
        }
      }
    } catch (error: any) {
      console.error("Avatar update failed:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleAddBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await api.post("/api/upload/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.status === 201) {
        const newBanner = {
          title: "Slide mới",
          imageUrl: uploadRes.data.url,
          link: "/map",
          active: true,
          order: settings.banners?.length || 0,
        };
        
        setSettings({
          ...settings,
          banners: [...(settings.banners || []), newBanner],
        });
        toast.success("Đã thêm banner mới! ✨");
      }
    } catch (error) {
      console.error("Banner upload failed:", error);
      toast.error("Không thể tải ảnh banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeBanner = (index: number) => {
    const newBanners = [...settings.banners];
    newBanners.splice(index, 1);
    setSettings({ ...settings, banners: newBanners });
  };

  const toggleBanner = (index: number) => {
    const newBanners = [...settings.banners];
    newBanners[index].active = !newBanners[index].active;
    setSettings({ ...settings, banners: newBanners });
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Đang tải cấu hình...
        </p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Settings className="size-5" />
            </div>
            Cấu hình Hệ thống
          </h2>
          <p className="text-xs text-indigo-500/70 mt-1 font-medium">
            Điều chỉnh giao diện và quy tắc vận hành MapHome
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => fetchSettings()}
            className="rounded-2xl h-11 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest px-6"
          >
            <RotateCcw className="size-4 mr-2" /> Hoàn tác
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={saving}
            className="rounded-2xl h-11 bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-8 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all border-none"
          >
            <Save className="size-4 mr-2" />{" "}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-3 shadow-sm space-y-1.5 sticky top-24">
          <TabNav active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={<Globe />} label="Thông tin chung" />
          <TabNav active={activeTab === "banners"} onClick={() => setActiveTab("banners")} icon={<Layout />} label="Banner & Slide" />
          <TabNav active={activeTab === "seo"} onClick={() => setActiveTab("seo")} icon={<Layers />} label="SEO & Metadata" />
          <TabNav active={activeTab === "broadcast"} onClick={() => setActiveTab("broadcast")} icon={<Bell />} label="Truyền thông" />
          <TabNav active={activeTab === "policies"} onClick={() => setActiveTab("policies")} icon={<FileText />} label="Pháp lý & CS" />
          <TabNav active={activeTab === "automation"} onClick={() => setActiveTab("automation")} icon={<Activity />} label="Tự động hóa" />
          
          <div className="pt-2 mt-2 border-t border-slate-50">
            <TabNav active={activeTab === "account"} onClick={() => setActiveTab("account")} icon={<User />} label="Hồ sơ Admin" />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="p-10 space-y-10"
            >
              {activeTab === "general" && (
                <div className="space-y-8">
                  <SectionHeader title="Thông tin nền tảng" description="Cấu hình danh tính và liên hệ chính thức." />
                  <div className="grid grid-cols-2 gap-8">
                    <InputGroup label="Tên Website" value={settings.siteName} onChange={(val) => setSettings({ ...settings, siteName: val })} icon={<Globe className="size-4" />} />
                    <InputGroup label="Email Hỗ trợ" value={settings.contactEmail} onChange={(val) => setSettings({ ...settings, contactEmail: val })} icon={<Mail className="size-4" />} />
                    <InputGroup label="Hotline" value={settings.contactPhone} onChange={(val) => setSettings({ ...settings, contactPhone: val })} icon={<Phone className="size-4" />} />
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between p-6 bg-rose-50/30 rounded-[32px] border border-rose-100/50 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl text-rose-600 shadow-inner border border-rose-50 group-hover:rotate-12 transition-transform">
                          <ShieldAlert className="size-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">Chế độ Bảo trì</h4>
                          <p className="text-xs text-rose-600 font-medium">Tạm khóa toàn bộ truy cập từ người dùng.</p>
                        </div>
                      </div>
                      <Toggle checked={settings.maintenanceMode} onChange={(val) => setSettings({ ...settings, maintenanceMode: val })} color="rose" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "banners" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Quản lý Slider" description="Cấu hình các ảnh trình chiếu trên trang chủ." />
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all ${uploadingBanner ? "opacity-50" : ""}`}>
                      <Plus className="size-4" />
                      {uploadingBanner ? "Đang tải..." : "Thêm Slide"}
                      <input type="file" className="hidden" accept="image/*" onChange={handleAddBanner} disabled={uploadingBanner} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(settings.banners || []).map((banner: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/50 rounded-[32px] border border-slate-100 flex gap-6 items-center group">
                        <div className="w-40 h-24 rounded-2xl overflow-hidden bg-slate-200 shadow-sm shrink-0">
                          <img src={banner.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              value={banner.title} 
                              onChange={(e) => {
                                const newBanners = [...settings.banners];
                                newBanners[idx].title = e.target.value;
                                setSettings({...settings, banners: newBanners});
                              }}
                              className="w-full h-10 px-4 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" 
                              placeholder="Tiêu đề slide"
                            />
                            <input 
                              type="text" 
                              value={banner.link} 
                              onChange={(e) => {
                                const newBanners = [...settings.banners];
                                newBanners[idx].link = e.target.value;
                                setSettings({...settings, banners: newBanners});
                              }}
                              className="w-full h-10 px-4 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" 
                              placeholder="Link liên kết"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 border-l border-slate-200">
                          <Toggle checked={banner.active} onChange={() => toggleBanner(idx)} color="emerald" />
                          <button onClick={() => removeBanner(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-8">
                  <SectionHeader title="SEO & Metadata" description="Thiết lập cách website xuất hiện trên bộ máy tìm kiếm." />
                  <div className="space-y-6">
                    <InputGroup 
                      label="Tiêu đề Trang chủ (Meta Title)" 
                      value={settings.seo?.title} 
                      onChange={(val) => setSettings({ ...settings, seo: { ...settings.seo, title: val } })} 
                      icon={<Info className="size-4" />} 
                    />
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Mô tả Website (Meta Description)</label>
                        <textarea 
                          value={settings.seo?.description} 
                          onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, description: e.target.value } })}
                          className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                        />
                    </div>
                    <InputGroup 
                      label="Từ khóa (Keywords - phân cách bằng dấu phẩy)" 
                      value={settings.seo?.keywords} 
                      onChange={(val) => setSettings({ ...settings, seo: { ...settings.seo, keywords: val } })} 
                      icon={<Plus className="size-4" />} 
                    />
                  </div>
                </div>
              )}

              {activeTab === "broadcast" && (
                <div className="space-y-8">
                  <SectionHeader title="Truyền thông Hệ thống" description="Gửi thông báo quan trọng đến toàn bộ người dùng." />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-indigo-500/60 uppercase tracking-widest">Nội dung thông báo (Markdown)</label>
                      <textarea
                        value={settings.broadcastMessage}
                        onChange={(e) => setSettings({ ...settings, broadcastMessage: e.target.value })}
                        className="w-full min-h-[180px] p-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner resize-none"
                        placeholder="Nhập nội dung thông báo..."
                      />
                    </div>
                    <div className="flex items-center justify-between p-6 bg-emerald-50/30 rounded-[32px] border border-emerald-100/50">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl text-emerald-600 shadow-inner border border-emerald-50">
                          <Bell className="size-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Hiển thị trên Trang chủ</h4>
                          <p className="text-xs text-emerald-600 font-medium">Bật/tắt thanh thông báo ở đầu trang.</p>
                        </div>
                      </div>
                      <Toggle checked={settings.isBroadcastEnabled} onChange={(val) => setSettings({ ...settings, isBroadcastEnabled: val })} color="emerald" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "policies" && (
                <div className="space-y-8">
                  <SectionHeader title="Quản lý Chính sách" description="Cập nhật Điều khoản và Bảo mật cho người dùng." />
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Điều khoản Dịch vụ</label>
                      <textarea 
                        value={settings.policies?.termsOfService} 
                        onChange={(e) => setSettings({ ...settings, policies: { ...settings.policies, termsOfService: e.target.value } })}
                        className="w-full h-80 p-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                        placeholder="Nội dung điều khoản..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Chính sách Bảo mật</label>
                      <textarea 
                        value={settings.policies?.privacyPolicy} 
                        onChange={(e) => setSettings({ ...settings, policies: { ...settings.policies, privacyPolicy: e.target.value } })}
                        className="w-full h-80 p-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                        placeholder="Nội dung chính sách bảo mật..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "automation" && (
                <div className="space-y-8">
                  <SectionHeader title="Tự động hóa & Quy tắc" description="Thiết lập các tham số thời gian tự động." />
                  <div className="grid grid-cols-2 gap-8">
                    <InputGroup 
                      label="Thời hạn tin đăng mặc định (Ngày)" 
                      type="number" 
                      value={settings.automation?.defaultExpiryDays} 
                      onChange={(val) => setSettings({ ...settings, automation: { ...settings.automation, defaultExpiryDays: Number(val) } })} 
                      icon={<Clock className="size-4" />} 
                    />
                    <InputGroup 
                      label="Thời gian trạng thái 'Tin Gấp' (Ngày)" 
                      type="number" 
                      value={settings.automation?.urgentDurationDays} 
                      onChange={(val) => setSettings({ ...settings, automation: { ...settings.automation, urgentDurationDays: Number(val) } })} 
                      icon={<Zap className="size-4" />} 
                    />
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-10">
                  <SectionHeader title="Hồ sơ quản trị" description="Thông tin cá nhân và bảo mật tài khoản." />
                  <div className="flex flex-col items-center gap-6 pb-10 border-b border-slate-50">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[40px] border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black group-hover:scale-105 transition-transform duration-500 relative">
                        {user?.avatar ? (
                          <img src={getAvatarUrl(user.avatar) || ""} className={`w-full h-full object-cover ${updatingAvatar ? "opacity-40" : ""}`} />
                        ) : (
                          getInitials(user?.fullName, user?.username)
                        )}
                        {updatingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <label className={`absolute -bottom-2 -right-2 p-3 bg-white text-emerald-600 rounded-2xl shadow-xl transition-all transform hover:rotate-12 border border-slate-100 ${updatingAvatar ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-emerald-600 hover:text-white"}`}>
                        <Camera className="size-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={updatingAvatar} />
                      </label>
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">{user?.fullName}</h4>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Super Administrator</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <InputGroup label="Email đăng nhập" value={user?.email || ""} onChange={() => {}} icon={<Mail className="size-4" />} />
                    <InputGroup label="Số điện thoại" value={user?.phone || ""} onChange={() => {}} icon={<Phone className="size-4" />} />
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-4 rounded-2xl text-indigo-50 shadow-inner group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-500">
                        <Key className="size-6" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest">Bảo mật mật khẩu</h5>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">Yêu cầu xác nhận mật khẩu hiện tại</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl h-10 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest px-6 hover:bg-white shadow-sm transition-all hover:scale-105">
                      Thay đổi ngay <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <ConfirmDialog 
            open={deleteConfirm.open} 
            title={deleteConfirm.title} 
            description={deleteConfirm.description} 
            confirmText="Xoá" 
            cancelText="Huỷ" 
            onConfirm={async () => { await deleteConfirm.onConfirm?.(); setDeleteConfirm({ open: false }); }} 
            onCancel={() => setDeleteConfirm({ open: false })} 
          />
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({ checked, onChange, color = "emerald" }: { checked: boolean, onChange: (val: boolean) => void, color?: string }) {
  const colors: Record<string, string> = {
    emerald: "peer-checked:bg-emerald-600",
    rose: "peer-checked:bg-rose-600",
    indigo: "peer-checked:bg-indigo-600"
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer scale-110">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-7 after:transition-all ${colors[color]} shadow-inner`}></div>
    </label>
  );
}

function TabNav({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[13px] font-black tracking-tight transition-all active:scale-95 ${
        active
          ? "text-white"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100"
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        />
      )}
      <span className="relative z-10 [&>svg]:size-5">{icon}</span>
      <span className="relative z-10">{label}</span>
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full relative z-10"
        />
      )}
    </button>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-base font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest leading-none mb-1">
        {title}
      </h3>
      <p className="text-xs font-bold text-indigo-500/50 italic mt-1.5">
        {description}
      </p>
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  icon,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-12 ${icon ? "pl-11" : "px-5"} pr-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-emerald-700 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner`}
        />
      </div>
    </div>
  );
}

