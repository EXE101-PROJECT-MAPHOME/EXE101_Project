import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { Download, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export function DownloadPage() {
  const apkUrl = `${window.location.origin}/MapHome.apk`;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Left Side: Info */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80')] bg-cover bg-center" />
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6 shadow-xl">
                    <Smartphone className="size-8 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight drop-shadow-md">
                    Tải Ứng Dụng <span className="text-emerald-400">MapHome</span>
                  </h1>
                  <p className="text-lg text-emerald-100 mb-8 max-w-md">
                    Trải nghiệm tìm kiếm nhà trọ thông minh, nhanh chóng và an toàn nhất ngay trên điện thoại của bạn.
                  </p>

                  <div className="space-y-4">
                    {[
                      "Tìm kiếm phòng trọ với bản đồ tương tác",
                      "Nhận thông báo phòng mới tức thì",
                      "Liên hệ trực tiếp chủ nhà không qua trung gian",
                      "Bảo mật và xác thực thông tin 100%"
                    ].map((feature, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle2 className="size-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-50 font-medium">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Side: QR Code & Download */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center bg-white relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">Cài đặt trực tiếp (APK)</h2>
                  <p className="text-slate-500 text-sm">Quét mã QR bằng camera điện thoại hoặc nhấn nút tải xuống để cài đặt ứng dụng Android.</p>
                </div>

                <div className="p-4 bg-white border-2 border-emerald-100 rounded-3xl shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(apkUrl)}`}
                    alt="QR Code to Download APK"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                </div>

                <div className="w-full space-y-3 pt-4">
                  <a
                    href={apkUrl}
                    download="MapHome.apk"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                  >
                    <Download className="size-5" />
                    <span className="text-base">Tải file APK ngay</span>
                  </a>
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>File an toàn, đã được kiểm duyệt</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
