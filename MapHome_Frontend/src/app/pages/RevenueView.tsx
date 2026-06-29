import { useState, useEffect } from 'react';
import { Search, TrendingUp, DollarSign, Calendar, Download, ArrowUpRight, ArrowDownRight, Activity, PieChart } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import api from '@/app/utils/api';

export function RevenueView() {
  const [activeTimeFilter, setActiveTimeFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/stats/revenue");
        if (res.status === 200) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch revenue stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
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

  const monthlyTrends = stats?.monthlyTrends || [];
  const revenueData = monthlyTrends.length > 0 
    ? monthlyTrends.map((t: any) => t.revenue) 
    : [0, 0, 0, 0, 0, 0];
  const months = monthlyTrends.length > 0
    ? monthlyTrends.map((t: any) => `T${t._id.month}`)
    : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
  
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
        
        {/* Modern Filter Bar */}
        <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
          {(['month', 'quarter', 'year'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveTimeFilter(filter)}
              className={`relative px-4 py-1.5 text-xs font-bold transition-all rounded-xl ${
                activeTimeFilter === filter ? "text-emerald-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTimeFilter === filter && (
                <motion.div
                  layoutId="activeRevTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 capitalize">{filter === 'month' ? 'Tháng' : filter === 'quarter' ? 'Quý' : 'Năm'}</span>
            </button>
          ))}
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

          <div className="relative h-[220px] px-2 mb-4">
             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Horizontal Grid */}
                {[20, 40, 60, 80].map(y => (
                  <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="4 4" />
                ))}

                {/* Animated Path */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                  d={revenueData.reduce((acc: string, val: number, idx: number) => {
                    const x = (idx / Math.max(1, revenueData.length - 1)) * 100;
                    const y = 100 - Math.min(90, Math.max(10, (val / (Math.max(...revenueData) || 1)) * 80));
                    return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
                  }, "")}
                  fill="none"
                  stroke="url(#revGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <defs>
                  <linearGradient id="revGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Data Points */}
                {revenueData.map((val: number, idx: number) => {
                  const x = (idx / Math.max(1, revenueData.length - 1)) * 100;
                  const y = 100 - Math.min(90, Math.max(10, (val / (Math.max(...revenueData) || 1)) * 80));
                  return (
                    <motion.circle
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * idx + 1 }}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="white"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="cursor-pointer hover:r-[5] transition-all"
                    />
                  );
                })}
             </svg>
             
             {/* X-axis Labels */}
             <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-2">
                {months.map((m, i) => (
                  <span key={i} className="text-[10px] font-black text-slate-400 uppercase">{m}</span>
                ))}
             </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trung bình/Tháng</p>
                   <p className="text-lg font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                     {Math.round((stats?.totalRevenue || 0) / Math.max(1, revenueData.length)).toLocaleString()}đ
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

          <div className="flex-1 space-y-6">
            {Object.entries(stats?.revenueByPackage || {}).map(([key, value]: [string, any], idx) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-slate-600 capitalize">{key}</span>
                  </div>
                  <span className="font-black text-slate-900">{((value.amount / (stats.totalRevenue || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(value.amount / (stats.totalRevenue || 1)) * 100}%` }}
                    transition={{ duration: 1, delay: 0.8 + (idx * 0.1) }}
                    className={`absolute inset-y-0 left-0 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-slate-400 font-bold">{value.count} giao dịch</span>
                   <span className="text-emerald-600 font-black">{value.amount.toLocaleString()}đ</span>
                </div>
              </div>
            ))}
            
            {Object.keys(stats?.revenueByPackage || {}).length === 0 && (
               <div className="flex flex-col items-center justify-center py-10 text-slate-300">
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
                        {tx.landlordId?.name?.substring(0, 1).toUpperCase() || "L"}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{tx.landlordId?.name || "Landlord"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {tx.packageType || "Dịch vụ"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-emerald-500">{(tx.amount || 0).toLocaleString()}đ</span>
                  </td>
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="size-3.5" />
                        <span className="text-[11px] font-bold">
                          {tx.completedAt ? new Date(tx.completedAt).toLocaleDateString() : "---"}
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
