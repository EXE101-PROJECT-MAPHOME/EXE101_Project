import { useState, useEffect, forwardRef, useRef } from 'react';
import { Search, TrendingUp, Calendar, Download, ArrowUpRight, Activity, PieChart } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import api from '@/app/utils/api';
import {
  AreaChart as _AreaChart,
  Area as _Area,
  XAxis as _XAxis,
  YAxis as _YAxis,
  CartesianGrid as _CartesianGrid,
  Tooltip as _Tooltip,
  ResponsiveContainer as _ResponsiveContainer,
  PieChart as _PieChart,
  Pie as _Pie,
  Cell as _Cell,
  Legend as _Legend,
} from 'recharts';

const AreaChart = _AreaChart as any;
const Area = _Area as any;
const XAxis = _XAxis as any;
const YAxis = _YAxis as any;
const CartesianGrid = _CartesianGrid as any;
const Tooltip = _Tooltip as any;
const ResponsiveContainer = _ResponsiveContainer as any;
const RePieChart = _PieChart as any;
const Pie = _Pie as any;
const Cell = _Cell as any;
const Legend = _Legend as any;

export function RevenueView() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (selectedMonth > 0) queryParams.append("month", selectedMonth.toString());
        if (selectedYear > 0) queryParams.append("year", selectedYear.toString());
        const qs = queryParams.toString();
        
        const statsUrl = `/api/admin/stats/revenue${qs ? `?${qs}` : ''}`;
        const chartUrl = `/api/admin/stats/chart${qs ? `?${qs}` : ''}`;

        const [statsRes, chartRes] = await Promise.all([
          api.get(statsUrl),
          api.get(chartUrl)
        ]);
        
        if (statsRes.status === 200) setStats(statsRes.data);
        if (chartRes.status === 200) setChartData(chartRes.data);
      } catch (err) {
        console.error("Failed to fetch revenue stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [selectedMonth, selectedYear]);

  // Click outside listener for Date Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center scale-75">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400 animate-pulse">Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
  };

  const pieColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
  const pieData = Object.entries(stats?.revenueByPackage || {}).map(([key, val]: [string, any]) => ({
    name: key,
    value: val.amount,
    count: val.count
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
          <div className="flex flex-col gap-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-xs font-semibold text-slate-600 capitalize">{entry.name}:</span>
                <span className="text-xs font-black text-slate-900">{entry.value.toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <h2 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent capitalize tracking-tight">Báo cáo Doanh thu</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Phân tích hiệu quả kinh doanh và dòng tiền hệ thống</p>
        </div>
        
        {/* Date Picker Trigger */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              {selectedMonth === 0 && selectedYear === 0 ? "Tất cả thời gian" : `${selectedMonth === 0 ? "Cả năm" : `Tháng ${selectedMonth}`} / ${selectedYear === 0 ? "Tất cả" : selectedYear}`}
            </span>
          </button>

          <AnimatePresence>
            {isDatePickerOpen && (
              <MonthYearPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onSelect={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                  setIsDatePickerOpen(false);
                }}
                onClose={() => setIsDatePickerOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RevenueKPICard
          icon="💰"
          label="Tổng doanh thu"
          value={(stats?.totalRevenue || 0).toLocaleString() + "đ"}
          change={stats?.revenueChange || "+0.0%"}
          color="emerald"
        />
        <RevenueKPICard
          icon="📈"
          label="Lợi nhuận ròng"
          value={(stats?.totalRevenue || 0).toLocaleString() + "đ"}
          change={stats?.revenueChange || "+0.0%"}
          color="blue"
        />
        <RevenueKPICard
          icon="🗺️"
          label="Chi phí Maps API"
          value={(stats?.mapsApiCost || 0).toLocaleString() + "đ"}
          change={stats?.mapsApiCost > 0 ? "Phí tích lũy" : "Tối ưu"}
          color="amber"
        />
        <RevenueKPICard
          icon="⏳"
          label="Chờ xử lý"
          value={(stats?.pendingCount || 0).toLocaleString() + " GD"}
          change={stats?.pendingCount > 0 ? "Cần xử lý" : "Nhanh"}
          color="rose"
        />
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Left - Revenue Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest">Biểu đồ tăng trưởng</h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu</span>
               </div>
               <TrendingUp className="size-5 text-emerald-500" />
            </div>
          </div>

          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    dx={-10}
                    tickFormatter={(val) => {
                      if (val === 0) return "0";
                      if (val < 1000) return `${val}đ`;
                      return `${val / 1000}k`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Doanh thu"
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-bold text-slate-400">Không có dữ liệu biểu đồ</span>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trung bình/Kỳ</p>
                   <p className="text-lg font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                     {Math.round((stats?.totalRevenue || 0) / Math.max(1, chartData.length)).toLocaleString()}đ
                   </p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tăng trưởng</p>
                   <p className="text-lg font-black text-emerald-600">{stats?.revenueChange || "+0.0%"}</p>
                </div>
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black hover:bg-emerald-100 transition-colors">
               <ArrowUpRight className="size-4" /> Chi tiết biến động
             </button>
          </div>
        </motion.div>

        {/* Right - Revenue Sources */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest">Nguồn doanh thu</h3>
            <Activity className="size-5 text-indigo-500" />
          </div>

          <div className="flex-1">
            {pieData.length > 0 ? (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}
                      formatter={(value, entry: any) => (
                        <span className="capitalize">{value}</span>
                      )}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-10 h-[220px] text-slate-300">
                  <PieChart className="size-12 opacity-20 mb-2" />
                  <p className="text-[11px] font-bold uppercase tracking-widest">Chưa có dữ liệu phân bổ</p>
               </div>
            )}
          </div>

          <div className="mt-8 p-5 bg-slate-50 rounded-[24px] border border-slate-100">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[11px] font-black text-slate-400 uppercase">Doanh thu dự kiến</span>
               <span className="text-xs font-black text-slate-800">120.000.000đ</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
               <div className="w-3/4 h-full bg-slate-400 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions History */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between md:items-center bg-white">
          <div>
            <h3 className="text-sm font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-widest">Lịch sử giao dịch</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">10 Giao dịch gần nhất</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
             <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm mã GD, tên..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:border-emerald-500 outline-none w-full transition-all"
                />
             </div>
             <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 w-full sm:w-auto">
               <Download className="size-4" /> Xuất file CSV
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao dịch</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Chủ trọ</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(stats?.latestTransactions || []).map((tx: any) => (
                <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-black text-slate-800 font-mono">#{tx._id.substring(tx._id.length - 8).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        {tx.userId?.name?.substring(0, 1).toUpperCase() || "U"}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{tx.userId?.name || "Người dùng"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {tx.description || "Dịch vụ"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-emerald-500">{(tx.amount || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="size-3.5" />
                        <span className="text-[11px] font-bold">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "---"}
                        </span>
                     </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full w-fit">
                      <div className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Thành công</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats?.latestTransactions || stats.latestTransactions.length === 0) && (
                <tr>
                   <td colSpan={6} className="px-8 py-12 text-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Chưa phát sinh giao dịch nào</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

const MonthYearPicker = forwardRef(function MonthYearPicker(
  {
    selectedMonth,
    selectedYear,
    onSelect,
    onClose,
  }: {
    selectedMonth: number;
    selectedYear: number;
    onSelect: (m: number, y: number) => void;
    onClose: () => void;
  },
  ref: any,
) {
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const years = [2024, 2025, 2026];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        ref={ref}
        className="absolute top-12 right-0 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-50 backdrop-blur-xl"
      >
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
              Chọn năm
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelect(selectedMonth, 0)}
                className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedYear === 0
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Tất cả
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => onSelect(selectedMonth, y)}
                  className={`flex-1 min-w-[60px] py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedYear === y
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
              Chọn tháng
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSelect(0, selectedYear)}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all ${
                  selectedMonth === 0
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                Tất cả
              </button>
              {months.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => onSelect(idx + 1, selectedYear)}
                  className={`py-2 rounded-xl text-[11px] font-bold transition-all ${
                    selectedMonth === idx + 1
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
});

function RevenueKPICard({ icon, label, value, change, color }: { icon: string; label: string; value: string; change: string; color: string }) {
  const gradientStyles = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-200/50",
    blue: "from-blue-600 to-indigo-700 shadow-blue-200/50",
    amber: "from-orange-500 to-amber-600 shadow-amber-200/50",
    rose: "from-rose-500 to-pink-600 shadow-rose-200/50",
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      className={`relative overflow-hidden p-8 rounded-[40px] shadow-2xl group transition-all duration-500`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientStyles[color as keyof typeof gradientStyles]}`} />
      
      {/* Luminous Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity blur-3xl bg-white" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30 group-hover:rotate-6 transition-transform duration-300">
             {icon}
          </div>
          <div className="px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/30">
            {change}
          </div>
        </div>
        <div className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{value}</div>
      </div>
    </motion.div>
  );
}
