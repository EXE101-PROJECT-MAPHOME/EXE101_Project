import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { Download, ShieldCheck } from "lucide-react";
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
            {/* Left Side: Info (Poster Image) */}
            <div className="bg-[#e4f1ed] flex items-center justify-center relative overflow-hidden">
              <img 
                src="/images/maphome-download-poster.jpg" 
                alt="MapHome Giới thiệu" 
                className="w-full h-full object-contain md:object-cover lg:object-contain"
              />
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
                    target="_blank"
                    rel="noopener noreferrer"
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
