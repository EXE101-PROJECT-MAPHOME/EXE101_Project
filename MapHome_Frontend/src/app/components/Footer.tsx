import { Link } from 'react-router';
import { Home, Mail, FileText, MessageCircle, Facebook, Twitter, Instagram, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 md:py-10 w-full">
        <div className="flex flex-wrap gap-y-6 gap-x-4 sm:gap-x-6 md:gap-x-8 justify-between">
          {/* Brand */}
          <div className="w-[45%] md:w-[22%] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Home className="size-4 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">MapHome</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
              Nền tảng tìm kiếm nhà trọ uy tín, minh bạch với hệ thống xác thực "Trust is King"
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors flex-shrink-0">
                <Facebook className="size-3.5" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center transition-colors flex-shrink-0">
                <Twitter className="size-3.5" />
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors flex-shrink-0">
                <Instagram className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-[45%] md:w-[15%]">
            <h4 className="font-semibold text-white mb-2.5 sm:mb-3 text-sm">Liên kết nhanh</h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs">
              <li>
                <Link to="/" className="hover:text-green-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-green-400 transition-colors">
                  Tìm trọ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-green-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-green-400 transition-colors">
                  Đăng ký tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="w-[45%] md:w-[15%]">
            <h4 className="font-semibold text-white mb-2.5 sm:mb-3 text-sm">Tài nguyên</h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs">
              <li>
                <Link to="/policy" className="hover:text-green-400 transition-colors flex items-center gap-1.5">
                  <FileText className="size-3" />
                  Chính sách
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-green-400 transition-colors flex items-center gap-1.5">
                  <Mail className="size-3" />
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="w-[45%] md:w-[22%]">
            <h4 className="font-semibold text-white mb-2.5 sm:mb-3 text-sm">Liên hệ</h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs">
              <li className="flex items-start gap-1.5">
                <Mail className="size-3 mt-0.5 flex-shrink-0" />
                <span>Maphome2026@gmail.com</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Home className="size-3 mt-0.5 flex-shrink-0" />
                <span>Số 1, Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
              </li>
            </ul>
          </div>

          {/* Mobile App Download */}
          <div className="w-[45%] md:w-[20%] space-y-3">
            <h4 className="font-semibold text-white mb-2.5 sm:mb-3 text-sm">Ứng dụng di động</h4>
            <div className="flex flex-col gap-2.5">
              {/* QR Code - Hidden on Mobile */}
              <div className="hidden md:flex flex-col items-center p-2 bg-white rounded-xl w-32 border border-gray-800">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://maphome-app.s3.ap-southeast-1.amazonaws.com/MapHome.apk" 
                  alt="QR Code APK"
                  className="w-24 h-24 object-contain"
                />
                <span className="text-[9px] text-gray-600 mt-1 font-bold text-center">Quét tải APK</span>
              </div>
              {/* Download Button */}
              <a 
                href="https://maphome-app.s3.ap-southeast-1.amazonaws.com/MapHome.apk"
                download="MapHome.apk"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-lg text-xs transition-all active:scale-95 shadow-md shadow-green-900/20 w-32 text-center"
              >
                Tải file APK
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
          <p className="text-gray-400">
            &copy; 2026 MapHome. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/policy" className="text-gray-400 hover:text-green-400 transition-colors">
              Điều khoản dịch vụ
            </Link>
            <Link to="/policy" className="text-gray-400 hover:text-green-400 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link to="/admin/login" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1">
              <Shield className="size-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}