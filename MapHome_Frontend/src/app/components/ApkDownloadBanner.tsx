import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, ArrowRight, ShieldCheck, Settings, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface ApkDownloadBannerProps {
  apkUrl?: string;
}

export function ApkDownloadBanner({ 
  apkUrl
}: ApkDownloadBannerProps) {
  const finalApkUrl = apkUrl || "https://expo.dev/accounts/dang_thanh_tu/projects/maphome/builds/86ebb301-1ccf-4ef5-a89c-38c822e7e70d";
  const [isMobile, setIsMobile] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [inAppBrowserType, setInAppBrowserType] = useState<"zalo" | "facebook" | "tiktok" | "other" | null>(null);

  // Detect mobile view & in-app browsers
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Detect User Agent for In-App browsers
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isFB = ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1 || ua.indexOf("Messenger") > -1;
    const isZalo = ua.indexOf("Zalo") > -1;
    const isTikTok = ua.indexOf("musical_ly") > -1 || ua.indexOf("TikTok") > -1;
    
    if (isFB || isZalo || isTikTok) {
      setIsInAppBrowser(true);
      if (isZalo) setInAppBrowserType("zalo");
      else if (isFB) setInAppBrowserType("facebook");
      else if (isTikTok) setInAppBrowserType("tiktok");
      else setInAppBrowserType("other");
    }

    // Check if user has closed the banner in this session
    const isBannerDismissed = sessionStorage.getItem("apk-banner-dismissed");
    if (!isBannerDismissed) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCloseBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    sessionStorage.setItem("apk-banner-dismissed", "true");
  };

  const handleDownload = () => {
    if (isInAppBrowser) {
      // If inside in-app browser, we shouldn't trigger direct download, just let user know
      setShowGuideModal(true);
    } else {
      // Open the expo download page in a new tab
      window.open(finalApkUrl, '_blank');

      // Open the step-by-step installation guide
      setShowGuideModal(true);
    }
  };

  // Only show on mobile
  if (!isMobile || !showBanner) return null;

  return (
    <>
      {/* ─── STICKY BOTTOM BANNER ─────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6"
          >
            <div className="max-w-md mx-auto bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.3)] flex items-center justify-between p-4 gap-3 relative overflow-hidden group">
              {/* Decorative aura */}
              <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
              
              {/* App Icon */}
              <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/20 relative z-10">
                <img 
                  src="/images/MapHome_logo_2.png" 
                  alt="MapHome Logo" 
                  className="w-10 h-10 object-cover" 
                />
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 relative z-10">
                <h4 className="text-sm font-bold text-white leading-snug">Ứng dụng MapHome</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  Tải ngay file APK để tìm trọ bản đồ cực mượt trên Android!
                </p>
              </div>

              {/* Download Button */}
              <div className="flex items-center gap-2 relative z-10">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download className="size-3.5" />
                  Tải APK
                </button>
                
                {/* Dismiss button */}
                <button
                  onClick={handleCloseBanner}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── GUIDE / WARNING MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuideModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-6 z-10 max-h-[85vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>

              {/* ─── SCENARIO A: Inside Facebook / Zalo / TikTok ─── */}
              {isInAppBrowser ? (
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 animate-bounce">
                    <AlertTriangle className="size-8" />
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    Trình duyệt hiện tại bị hạn chế
                  </h3>
                  
                  <p className="text-sm text-slate-600">
                    Ứng dụng {inAppBrowserType === "zalo" ? "Zalo" : inAppBrowserType === "facebook" ? "Facebook/Messenger" : inAppBrowserType === "tiktok" ? "TikTok" : "nội bộ này"} chặn tính năng tải file APK trực tiếp.
                  </p>

                  <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-3">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Settings className="size-4" /> Vui lòng làm theo hướng dẫn:
                    </p>
                    <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                      <li>Bấm vào biểu tượng <strong>3 dấu chấm (...)</strong> hoặc <strong>dấu chia sẻ</strong> ở thanh tiêu đề trên cùng.</li>
                      <li>Chọn <strong>"Mở bằng trình duyệt ngoài"</strong> (Open in Browser/Chrome/Safari).</li>
                      <li>Bấm <strong>Tải ngay APK</strong> ở trang web mới mở để tiến hành tải file an toàn.</li>
                    </ol>
                  </div>

                  <div className="w-full pt-2">
                    <Button 
                      onClick={() => setShowGuideModal(false)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-sm shadow-md"
                    >
                      Tôi đã hiểu
                    </Button>
                  </div>
                </div>
              ) : (
                // ─── SCENARIO B: Normal Mobile Browser Installation Guide ───
                <div className="flex flex-col overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  <div className="flex flex-col items-center text-center space-y-2 pt-2 pb-4 border-b border-slate-100">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="size-7" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">
                      Đang tiến hành tải file APK
                    </h3>
                    <p className="text-xs text-slate-500">
                      Vui lòng xem các bước cài đặt dưới đây để khởi chạy App.
                    </p>
                  </div>

                  {/* Step list */}
                  <div className="py-4 space-y-4 flex-1">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-emerald-500/20">
                        1
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Đợi tải xuống</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Nhìn vào thanh trạng thái tải của trình duyệt. File tải về có định dạng <strong>MapHome.apk</strong>.
                        </p>
                        {/* Pulse progress bar simulation */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full w-[60%] bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-emerald-500/20">
                        2
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cho phép cài đặt</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Mở file vừa tải. Nếu hệ thống hiển thị cảnh báo bảo mật, hãy vào <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Cài đặt (Settings)</strong> → Kích hoạt <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">"Cho phép từ nguồn này"</strong> (Allow from this source).
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-emerald-500/20">
                        3
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Bắt đầu trải nghiệm</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Bấm nút <strong>Cài đặt (Install)</strong> trong hộp thoại của điện thoại, sau đó mở ứng dụng MapHome.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <a
                      href={finalApkUrl}
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-center text-sm shadow-md transition-all active:scale-98"
                    >
                      <Download className="size-4" /> Tải lại file APK
                    </a>
                    <button
                      onClick={() => setShowGuideModal(false)}
                      className="py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors"
                    >
                      Đóng hướng dẫn
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
