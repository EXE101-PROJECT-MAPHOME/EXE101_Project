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
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import api from "@/app/utils/api";

export function AdminVoucherView() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    maxUses: "",
    isActive: true,
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
      await api.post("/api/vouchers", {
        code: newVoucher.code,
        discountPercentage: Number(newVoucher.discountPercentage),
        startDate: new Date(newVoucher.startDate).toISOString(),
        endDate: new Date(newVoucher.endDate).toISOString(),
        maxUses: newVoucher.maxUses ? Number(newVoucher.maxUses) : null,
        isActive: newVoucher.isActive,
      });
      toast.success("Tạo voucher thành công!");
      setIsCreating(false);
      setNewVoucher({
        code: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        maxUses: "",
        isActive: true,
      });
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo voucher");
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quản lý Voucher</h2>
          <p className="text-sm text-slate-500">Tạo và quản lý các mã giảm giá hệ thống</p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
        >
          {isCreating ? <XCircle className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {isCreating ? "Hủy bỏ" : "Tạo Voucher mới"}
        </Button>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50"
        >
          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
            <Ticket className="w-5 h-5 mr-2 text-indigo-500" />
            Tạo mã giảm giá mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mã Voucher *
              </label>
              <input
                type="text"
                placeholder="VD: TET2026"
                value={newVoucher.code}
                onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phần trăm giảm (%) *
              </label>
              <input
                type="number"
                placeholder="0-100"
                value={newVoucher.discountPercentage}
                onChange={(e) => setNewVoucher({ ...newVoucher, discountPercentage: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Số lượt tối đa (Bỏ trống = Vô hạn)
              </label>
              <input
                type="number"
                placeholder="Số lượt"
                value={newVoucher.maxUses}
                onChange={(e) => setNewVoucher({ ...newVoucher, maxUses: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ngày giờ bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={newVoucher.startDate}
                onChange={(e) => setNewVoucher({ ...newVoucher, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ngày giờ kết thúc *
              </label>
              <input
                type="datetime-local"
                value={newVoucher.endDate}
                onChange={(e) => setNewVoucher({ ...newVoucher, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-start pt-8">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVoucher.isActive}
                  onChange={(e) => setNewVoucher({ ...newVoucher, isActive: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-700">Kích hoạt ngay</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCreateVoucher}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" /> Lưu Voucher
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chưa có mã giảm giá nào được tạo.</p>
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
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className={`p-5 flex items-start justify-between ${isAvailable ? 'bg-gradient-to-r from-indigo-50 to-blue-50' : 'bg-slate-50'}`}>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white shadow-sm mb-3">
                      {isAvailable ? (
                        <><CheckCircle className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-700">Khả dụng</span></>
                      ) : (
                        <><XCircle className="w-3 h-3 text-rose-500" /> <span className="text-rose-700">Không khả dụng</span></>
                      )}
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{voucher.code}</h4>
                  </div>
                  <div className="bg-white w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center flex-col border border-indigo-100">
                    <span className="text-lg font-black text-indigo-600">-{voucher.discountPercentage}%</span>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <Calendar className="w-4 h-4 mr-3 text-indigo-400" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Hiệu lực</div>
                      <div className="font-medium">
                        {new Date(voucher.startDate).toLocaleDateString('vi-VN')} - {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center">
                      <Percent className="w-4 h-4 mr-3 text-emerald-400" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Lượt dùng</div>
                        <div className="font-medium">
                          {voucher.usedCount} / {voucher.maxUses ? voucher.maxUses : "∞"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(voucher._id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-3 py-1.5 h-auto text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Xóa mã
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
