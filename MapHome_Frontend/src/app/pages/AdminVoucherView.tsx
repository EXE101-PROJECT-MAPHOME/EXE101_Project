import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Ticket,
  Plus,
  Trash2,
  Calendar,
  Percent,
  CheckCircle,
  XCircle,
  Save,
  Clock,
  FileSpreadsheet,
  Edit2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import api from "@/app/utils/api";
import * as XLSX from "xlsx";

export function AdminVoucherView() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    maxUses: "",
    isActive: true,
    title: "",
    description: "",
    bannerImage: "",
    showOnHome: false,
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vouchers");
      setVouchers(res.data || []);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async () => {
    if (!newVoucher.code || !newVoucher.discountPercentage || !newVoucher.startDate || !newVoucher.endDate) {
      toast.error("Vui lòng nhập đầy đủ mã, phần trăm giảm và thời gian");
      return;
    }
    try {
      const voucherData = {
        code: newVoucher.code,
        discountPercentage: Number(newVoucher.discountPercentage),
        startDate: new Date(newVoucher.startDate).toISOString(),
        endDate: new Date(newVoucher.endDate).toISOString(),
        maxUses: newVoucher.maxUses ? Number(newVoucher.maxUses) : null,
        isActive: newVoucher.isActive,
        title: newVoucher.title,
        description: newVoucher.description,
        bannerImage: newVoucher.bannerImage,
        showOnHome: newVoucher.showOnHome,
      };

      if (editingId) {
        await api.put(`/api/vouchers/${editingId}`, voucherData);
        toast.success("Cập nhật voucher thành công!");
      } else {
        await api.post("/api/vouchers", voucherData);
        toast.success("Tạo voucher thành công!");
      }

      setIsCreating(false);
      setEditingId(null);
      setNewVoucher({
        code: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        maxUses: "",
        isActive: true,
        title: "",
        description: "",
        bannerImage: "",
        showOnHome: false,
      });
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? "Lỗi khi cập nhật voucher" : "Lỗi khi tạo voucher"));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) {
      try {
        await api.delete(`/api/vouchers/${id}`);
        toast.success("Xóa voucher thành công!");
        fetchVouchers();
      } catch (error) {
        toast.error("Lỗi khi xóa voucher");
      }
    }
  };

  const handleEditClick = (voucher: any) => {
    const formatDateTimeLocal = (dateStr: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setEditingId(voucher._id);
    setNewVoucher({
      code: voucher.code,
      discountPercentage: voucher.discountPercentage.toString(),
      startDate: formatDateTimeLocal(voucher.startDate),
      endDate: formatDateTimeLocal(voucher.endDate),
      maxUses: voucher.maxUses ? voucher.maxUses.toString() : "",
      isActive: voucher.isActive,
      title: voucher.title || "",
      description: voucher.description || "",
      bannerImage: voucher.bannerImage || "",
      showOnHome: voucher.showOnHome || false,
    });
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const reader = new FileReader();
    const loadingToast = toast.loading("Đang đọc và xử lý file Excel...");
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (jsonData.length < 3) {
          toast.dismiss(loadingToast);
          toast.error("File Excel không đúng cấu trúc hoặc không có dữ liệu.");
          return;
        }

        const vouchers: any[] = [];
        
        for (let i = 2; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const voucherCode = row[1];
          if (!voucherCode) continue;

          const voucherCodeStr = voucherCode.toString().trim();
          if (
            voucherCodeStr === "" || 
            voucherCodeStr.toLowerCase() === "mã voucher" || 
            voucherCodeStr.includes("—") || 
            voucherCodeStr.includes("MÃ")
          ) {
            continue;
          }

          const title = row[2] ? row[2].toString().trim() : "";
          const targetUser = row[3] ? row[3].toString().trim() : "";
          const discountRaw = row[4];
          const startDateRaw = row[5];
          const endDateRaw = row[6];
          const maxUsesRaw = row[7];
          const type = row[8] ? row[8].toString().trim() : "";

          let discountPercentage = 0;
          if (discountRaw !== undefined && discountRaw !== null && discountRaw !== "-") {
            if (typeof discountRaw === "number") {
              discountPercentage = discountRaw <= 1 ? Math.round(discountRaw * 100) : discountRaw;
            } else {
              discountPercentage = parseInt(discountRaw.toString().replace("%", "")) || 0;
            }
          }

          const parseExcelDate = (dateVal: any) => {
            if (!dateVal) return null;
            
            if (typeof dateVal === "number") {
              const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
              return date.toISOString();
            }

            if (dateVal instanceof Date) {
              return dateVal.toISOString();
            }

            const strVal = dateVal.toString().trim();
            const parts = strVal.split("/");
            if (parts.length === 3) {
              const day = parts[0].padStart(2, "0");
              const month = parts[1].padStart(2, "0");
              
              const yearPart = parts[2].trim();
              const yearSubParts = yearPart.split(/\s+/);
              const year = yearSubParts[0];
              const time = yearSubParts[1] || "00:00:00";
              
              return new Date(`${year}-${month}-${day}T${time}`).toISOString();
            }

            return new Date(dateVal).toISOString();
          };

          let startDate: string | null = null;
          let endDate: string | null = null;

          try {
            startDate = parseExcelDate(startDateRaw);
            endDate = parseExcelDate(endDateRaw);
          } catch (dateErr) {
            console.error("Lỗi parse ngày:", dateErr);
          }

          if (!startDate || !endDate) {
            continue;
          }

          let maxUses = null;
          if (maxUsesRaw !== undefined && maxUsesRaw !== null) {
            const maxUsesStr = maxUsesRaw.toString().trim();
            if (maxUsesStr !== "Vô hạn" && maxUsesStr !== "" && maxUsesStr !== "-") {
              maxUses = parseInt(maxUsesStr) || null;
            }
          }

          vouchers.push({
            code: voucherCodeStr.toUpperCase(),
            discountPercentage,
            startDate,
            endDate,
            maxUses,
            title,
            description: `Đối tượng: ${targetUser} | Loại: ${type}`,
            isActive: true,
            showOnHome: false
          });
        }

        if (vouchers.length === 0) {
          toast.dismiss(loadingToast);
          toast.error("Không tìm thấy mã giảm giá hợp lệ nào để import.");
          return;
        }

        const res = await api.post("/api/vouchers/bulk", { vouchers });
        toast.dismiss(loadingToast);
        
        const { insertedCount, failedCount } = res.data;
        if (insertedCount > 0) {
          toast.success(`Đã nhập thành công ${insertedCount} mã giảm giá!`);
        }
        if (failedCount > 0) {
          toast.warning(`Có ${failedCount} mã bị bỏ qua (có thể do trùng lặp mã).`);
        }

        fetchVouchers();
      } catch (err: any) {
        toast.dismiss(loadingToast);
        console.error("Import error:", err);
        toast.error(err.response?.data?.message || "Lỗi khi xử lý file và lưu voucher.");
      }
    };

    reader.onerror = () => {
      toast.dismiss(loadingToast);
      toast.error("Lỗi khi đọc file Excel.");
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tighter">
            Quản trị Mã Giảm Giá
          </h3>
          <p className="text-sm font-bold text-slate-400 mt-1">
            Thiết lập và quản lý các chiến dịch khuyến mãi hệ thống
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <input
            type="file"
            id="excel-upload"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById("excel-upload")?.click()}
            className="bg-white hover:bg-slate-50 border-2 border-indigo-100 hover:scale-105 transition-all text-indigo-600 rounded-[22px] h-14 px-8 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-50/50 w-full sm:w-auto justify-center"
          >
            <FileSpreadsheet className="size-5" />
            Nhập từ Excel
          </Button>
          <Button
            onClick={() => {
              if (isCreating) {
                setEditingId(null);
                setNewVoucher({
                  code: "",
                  discountPercentage: "",
                  startDate: "",
                  endDate: "",
                  maxUses: "",
                  isActive: true,
                  title: "",
                  description: "",
                  bannerImage: "",
                  showOnHome: false,
                });
              }
              setIsCreating(!isCreating);
            }}
            className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 hover:scale-105 transition-all text-white rounded-[22px] h-14 px-10 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-none shadow-xl shadow-blue-200/50 w-full sm:w-auto justify-center"
          >
            {isCreating ? <XCircle className="size-5" /> : <Plus className="size-5" />}
            {isCreating ? "Hủy bỏ" : "Tạo Voucher mới"}
          </Button>
        </div>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[35px] border border-white/60 shadow-xl shadow-indigo-100/50 overflow-hidden"
        >
          <h3 className="text-lg font-black text-indigo-900 mb-6 flex items-center tracking-tight">
            <Ticket className="size-6 mr-3 text-indigo-500" />
            {editingId ? `Chỉnh sửa mã giảm giá: ${newVoucher.code}` : "Tạo mã giảm giá mới"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                Mã Voucher *
              </label>
              <input
                type="text"
                placeholder="VD: TET2026"
                value={newVoucher.code}
                onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 uppercase focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                Phần trăm giảm (%) *
              </label>
              <div className="relative group/input">
                <input
                  type="number"
                  placeholder="0-100"
                  value={newVoucher.discountPercentage}
                  onChange={(e) => setNewVoucher({ ...newVoucher, discountPercentage: e.target.value })}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">
                  %
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                Số lượt tối đa
              </label>
              <div className="relative group/input">
                <input
                  type="number"
                  placeholder="Bỏ trống = Vô hạn"
                  value={newVoucher.maxUses}
                  onChange={(e) => setNewVoucher({ ...newVoucher, maxUses: e.target.value })}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">
                  Lượt
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                Ngày giờ bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={newVoucher.startDate}
                onChange={(e) => setNewVoucher({ ...newVoucher, startDate: e.target.value })}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                Ngày giờ kết thúc *
              </label>
              <input
                type="datetime-local"
                value={newVoucher.endDate}
                onChange={(e) => setNewVoucher({ ...newVoucher, endDate: e.target.value })}
                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            
            {/* Promotional Fields */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-slate-100 pt-6 mt-2">
              <h4 className="text-sm font-black text-indigo-900 mb-4 tracking-tight">Cấu hình Quảng cáo (Tùy chọn)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                    Tiêu đề quảng cáo
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Siêu Sale Mùa Tựu Trường"
                    value={newVoucher.title}
                    onChange={(e) => setNewVoucher({ ...newVoucher, title: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                    Mô tả quảng cáo
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giảm 50% gói VIP cho sinh viên"
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">
                    Link ảnh Banner (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: https://example.com/banner.jpg"
                    value={newVoucher.bannerImage}
                    onChange={(e) => setNewVoucher({ ...newVoucher, bannerImage: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[22px] px-6 text-sm font-black text-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start pt-8 space-x-8">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVoucher.isActive}
                  onChange={(e) => setNewVoucher({ ...newVoucher, isActive: e.target.checked })}
                  className="size-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-black text-slate-700">Kích hoạt ngay</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVoucher.showOnHome}
                  onChange={(e) => setNewVoucher({ ...newVoucher, showOnHome: e.target.checked })}
                  className="size-5 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-black text-emerald-700">Hiển thị lên Trang chủ</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end mt-4 pt-6 border-t border-slate-100">
            <Button
              onClick={handleCreateVoucher}
              className="bg-emerald-500 hover:bg-emerald-600 hover:scale-105 transition-all text-white rounded-[22px] h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200/50"
            >
              <Save className="size-4 mr-2" /> {editingId ? "Cập nhật Voucher" : "Lưu Voucher"}
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="py-24 bg-slate-50/50 rounded-[35px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <Ticket className="size-16 mb-6 opacity-30 text-indigo-500" />
          <p className="font-black text-lg text-slate-600">Chưa có mã giảm giá nào được tạo</p>
          <p className="text-sm font-medium mt-2">Bấm vào nút "Tạo Voucher mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const isExpired = new Date(voucher.endDate) < new Date();
            const isFullyUsed = voucher.maxUses && voucher.usedCount >= voucher.maxUses;
            const isAvailable = voucher.isActive && !isExpired && !isFullyUsed;

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={voucher._id}
                className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[35px] overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1"
              >
                <div className={`p-6 flex items-start justify-between ${isAvailable ? 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80' : 'bg-slate-50/80'}`}>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 ${isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      {isAvailable ? (
                        <><CheckCircle className="size-3.5" /> Khả dụng</>
                      ) : (
                        <><XCircle className="size-3.5" /> Không khả dụng</>
                      )}
                    </span>
                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{voucher.code}</h4>
                  </div>
                  <div className="bg-white size-16 rounded-[22px] shadow-lg shadow-indigo-100/50 flex items-center justify-center flex-col border border-indigo-50 relative">
                    {voucher.showOnHome && (
                      <span className="absolute -top-2 -right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    )}
                    <span className="text-xl font-black text-indigo-600 bg-clip-text text-transparent bg-gradient-to-br from-emerald-500 to-indigo-600">-{voucher.discountPercentage}%</span>
                  </div>
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <div className="flex items-center text-sm text-slate-600 bg-white border border-slate-100 p-4 rounded-[22px] shadow-sm">
                    <div className="size-10 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4">
                      <Calendar className="size-5 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Hiệu lực</div>
                      <div className="font-black text-slate-700">
                        {new Date(voucher.startDate).toLocaleDateString('vi-VN')} - {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-slate-600 bg-white border border-slate-100 p-4 rounded-[22px] shadow-sm">
                    <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4">
                      <Percent className="size-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lượt dùng</div>
                      <div className="font-black text-slate-700">
                        <span className="text-emerald-600">{voucher.usedCount}</span> / {voucher.maxUses ? voucher.maxUses : "Vô hạn"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleEditClick(voucher)}
                    className="text-blue-500 hover:text-white hover:bg-blue-500 rounded-2xl px-5 py-2.5 h-auto text-[11px] font-black uppercase tracking-widest transition-all w-full sm:w-auto justify-center"
                  >
                    <Edit2 className="size-4 mr-2" /> Sửa mã
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(voucher._id)}
                    className="text-rose-500 hover:text-white hover:bg-rose-500 rounded-2xl px-5 py-2.5 h-auto text-[11px] font-black uppercase tracking-widest transition-all w-full sm:w-auto justify-center"
                  >
                    <Trash2 className="size-4 mr-2" /> Xóa mã
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
