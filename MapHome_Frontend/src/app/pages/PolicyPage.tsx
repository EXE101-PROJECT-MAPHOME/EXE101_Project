import { motion } from "framer-motion";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Card } from "@/app/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  Home,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  ClipboardCheck,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/app/utils/api";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const faqs = [
  {
    category: "Tìm trọ",
    questions: [
      {
        q: "Làm sao để tìm trọ gần nơi làm việc/trường học?",
        a: 'Bạn sử dụng tính năng "Tìm gần chỗ làm/trường" trên trang bản đồ, chọn địa điểm quan trọng (ví dụ: ĐH FPT, Samsung...), hệ thống sẽ hiển thị các phòng trọ xung quanh và tính khoảng cách chính xác.',
      },
      {
        q: "Ý nghĩa của bán kính tìm kiếm là gì?",
        a: "Bán kính tìm kiếm giúp bạn lọc các phòng trọ trong khoảng cách mong muốn từ vị trí của bạn hoặc địa điểm đã chọn. Bạn có thể điều chỉnh từ 1km đến 20km.",
      },
      {
        q: "Tôi có thể lưu các phòng trọ yêu thích không?",
        a: 'Có! Nhấn vào icon trái tim trên mỗi phòng trọ để lưu vào danh sách yêu thích. Bạn có thể xem lại bất cứ lúc nào bằng cách nhấn nút "Yêu thích" trên trang bản đồ.',
      },
      {
        q: "Làm sao để tìm trọ phù hợp với nhiều địa điểm cùng lúc?",
        a: "Sử dụng tính năng tìm kiếm đa điểm! Thêm nhiều địa điểm (ví dụ: trường + chỗ làm thêm), hệ thống sẽ tính điểm trung tâm tối ưu và hiển thị các phòng trọ gần nhất với tất cả địa điểm.",
      },
    ],
  },
  {
    category: "Xác thực & An toàn",
    questions: [
      {
        q: 'Hệ thống xác thực "Trust is King" là gì?',
        a: "Đây là hệ thống 3 cấp độ xác thực:\n• Cấp 1: Chưa xác thực (⚠️)\n• Cấp 2: Xác thực SĐT qua OTP (🔹)\n• Cấp 3: Xác thực GPS - chủ nhà phải đứng tại địa điểm đăng trọ (✅)\nChúng tôi khuyến khích chọn phòng trọ Cấp 2 và 3 để đảm bảo an toàn.",
      },
      {
        q: "Tại sao có phòng trọ chưa xác thực?",
        a: "Chủ nhà mới đăng ký có thể chưa hoàn tất quy trình xác thực. Bạn nên liên hệ cẩn thận, yêu cầu xem phòng trực tiếp và kiểm tra giấy tờ nhà trước khi đặt cọc.",
      },
      {
        q: "Làm sao biết tin đăng là thật?",
        a: 'Ưu tiên các tin có badge ✅ "Xác thực GPS" vì chủ nhà đã xác nhận đứng tại địa điểm. Kiểm tra thông tin chi tiết, ảnh thực tế, và luôn đặt lịch xem phòng trực tiếp trước khi quyết định.',
      },
      {
        q: "Tôi phát hiện tin giả, phải làm sao?",
        a: 'Nhấn nút "Báo cáo tin giả" trên trang chi tiết phòng trọ. Chúng tôi sẽ xem xét và xử lý trong vòng 24h. Cảm ơn bạn đã giúp cộng đồng an toàn hơn!',
      },
    ],
  },
  {
    category: "Đặt lịch & Liên hệ",
    questions: [
      {
        q: "Làm sao để đặt lịch xem phòng?",
        a: 'Nhấn nút "Đặt lịch" trên thẻ phòng trọ, chọn ngày giờ phù hợp, điền thông tin của bạn. Chủ nhà sẽ nhận thông báo và xác nhận với bạn qua điện thoại.',
      },
      {
        q: "Tôi có thể chat trực tiếp với chủ trọ không?",
        a: 'Hiện tại bạn có thể gọi điện trực tiếp qua nút "Gọi" hoặc đặt lịch xem phòng. Tính năng chat đang được phát triển và sẽ ra mắt sớm!',
      },
      {
        q: "Chủ nhà không trả lời tin nhắn/cuộc gọi?",
        a: "Hãy thử liên hệ vào khung giờ 8h-20h. Nếu chủ nhà không phản hồi sau 24h, bạn có thể báo cáo để chúng tôi kiểm tra tình trạng tin đăng.",
      },
    ],
  },
  {
    category: "Cho chủ trọ",
    questions: [
      {
        q: "Làm sao để đăng tin cho thuê phòng trọ?",
        a: 'Nhấn "Đăng trọ" trên trang chủ, điền thông tin phòng trọ, upload ảnh, chọn vị trí trên bản đồ. Để tăng độ tin cậy, hãy xác thực GPS bằng cách đến địa điểm phòng trọ.',
      },
      {
        q: "Xác thực GPS có bắt buộc không?",
        a: "Không bắt buộc nhưng KHUYẾN KHÍCH CAO! Tin đăng có xác thực GPS được ưu tiên hiển thị và thu hút nhiều người thuê hơn 5 lần.",
      },
      {
        q: "Tôi có thể chỉnh sửa/xóa tin đăng không?",
        a: "Có! Vào trang quản lý tin đăng, bạn có thể cập nhật giá, ảnh, trạng thái phòng hoặc xóa tin khi đã cho thuê.",
      },
      {
        q: "Làm sao quản lý lịch hẹn xem phòng?",
        a: "Bạn sẽ nhận thông báo Zalo khi có người đặt lịch. Vào Dashboard để xem danh sách, xác nhận hoặc từ chối lịch hẹn.",
      },
    ],
  },
  {
    category: "Thanh toán & Chính sách",
    questions: [
      {
        q: "MapHome có thu phí không?",
        a: "Hoàn toàn MIỄN PHÍ cho cả người tìm trọ và chủ nhà! Chúng tôi không thu bất kỳ khoản phí nào.",
      },
      {
        q: "Chính sách bảo mật dữ liệu?",
        a: "Chúng tôi không thu thập PII (thông tin cá nhân nhạy cảm). Dữ liệu của bạn được mã hóa và chỉ dùng để cải thiện trải nghiệm sử dụng.",
      },
      {
        q: "MapHome có hỗ trợ ký hợp đồng không?",
        a: "Hiện tại chúng tôi chỉ hỗ trợ kết nối người thuê - chủ nhà. Việc ký hợp đồng và thanh toán tiền trọ do hai bên tự thỏa thuận.",
      },
    ],
  },
];

const checklist = [
  {
    title: "🏠 Kiểm tra phòng trọ",
    items: [
      "Diện tích thực tế có đúng như tin đăng?",
      "Có cửa sổ, ánh sáng tự nhiên?",
      "Phòng có mùi ẩm mốc, nấm mọc tường?",
      "Kiểm tra điện nước hoạt động bình thường",
      "Thử khóa cửa, cửa sổ xem chắc chắn không",
      "Kiểm tra tường, trần có vết nứt/thấm nước?",
    ],
  },
  {
    title: "🔌 Tiện ích & Cơ sở vật chất",
    items: [
      "WiFi tốc độ bao nhiêu? Thử kết nối ngay",
      "Máy lạnh/quạt hoạt động tốt không?",
      "Nóng lạnh, bình nước nóng có dùng được?",
      "Tủ lạnh, tủ quần áo đủ không gian?",
      "Toilet sạch sẽ, nước xả mạnh không?",
      "Bếp có bếp ga/điện? Được nấu ăn không?",
    ],
  },
  {
    title: "💰 Chi phí & Hợp đồng",
    items: [
      "Giá thuê bao gồm những gì? (điện, nước, wifi, rác)",
      "Giá điện/nước bao nhiêu tiền/kwh, m³?",
      "Đặt cọc bao nhiêu tháng? Hoàn lại khi nào?",
      "Thời hạn hợp đồng tối thiểu?",
      "Quy định về khách, giờ giấc?",
      "Được nuôi thú cưng không?",
    ],
  },
  {
    title: "🔐 An ninh & Chủ nhà",
    items: [
      "Có camera an ninh? Bảo vệ?",
      "Khu vực có đèn đường, an toàn về đêm?",
      "Chủ nhà có giấy tờ nhà đất hợp lệ?",
      "Kiểm tra CMND/CCCD chủ nhà",
      "Có hợp đồng thuê chính thức không?",
      "Hỏi người thuê cũ về chủ nhà (nếu có)",
    ],
  },
  {
    title: "📍 Vị trí & Xung quanh",
    items: [
      "Khoảng cách đến trường/công ty?",
      "Có xe bus/grab gần không?",
      "Gần chợ, siêu thị, quán ăn?",
      "Môi trường xung quanh có ồn ào?",
      "Có chỗ để xe an toàn?",
      "Khu vực có nhiều dịch vụ tiện ích?",
    ],
  },
];

export function PolicyPage() {
  const [policies, setPolicies] = useState<any>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get("/api/settings/public");
        if (res.status === 200 && res.data.policies) {
          setPolicies(res.data.policies);
        }
      } catch (error) {
        console.error("Failed to fetch policies");
      }
    };
    fetchPolicies();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-maphome-50 via-green-50 to-emerald-50 flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-maphome-600 to-emerald-500 text-white shadow-xl mb-6 transition-all duration-300"
            >
              <HelpCircle className="size-10" />
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-maphome-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
                Trợ Giúp & Pháp Lý
              </span>
            </h1>
            <p className="text-xl text-maphome-700 max-w-2xl mx-auto leading-relaxed">
              Mọi kiến thức, công cụ và quy định cần thiết để bạn an tâm cùng
              MapHome.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
          >
            {[
              {
                icon: MessageCircle,
                title: "FAQ",
                desc: "Hỏi đáp nhanh",
                bgColor: "from-blue-50 to-blue-100",
                iconColor: "text-blue-600",
                link: "#faq",
              },
              {
                icon: ShieldCheck,
                title: "Checklist",
                desc: "Đảm bảo an toàn",
                bgColor: "from-maphome-50 to-green-100",
                iconColor: "text-maphome-600",
                link: "#checklist",
              },
              {
                icon: ClipboardCheck,
                title: "Điều khoản",
                desc: "Quy định sử dụng",
                bgColor: "from-emerald-50 to-emerald-100",
                iconColor: "text-emerald-600",
                link: "#terms",
              },
              {
                icon: FileText,
                title: "Bảo mật",
                desc: "Chính sách dữ liệu",
                bgColor: "from-teal-50 to-teal-100",
                iconColor: "text-teal-600",
                link: "#privacy",
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card
                  className="p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group border-white/50 bg-gradient-to-br from-white to-maphome-50/20 backdrop-blur-sm hover:-translate-y-3"
                  onClick={() => {
                    const el = document.getElementById(item.link.substring(1));
                    if (el)
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      className={`p-4 rounded-xl mb-4 transition-all duration-300 shadow-sm bg-gradient-to-br ${item.bgColor}`}
                    >
                      <item.icon className={`size-6 ${item.iconColor}`} />
                    </motion.div>
                    <h3 className="font-bold text-sm mb-1 text-maphome-800">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-maphome-600 font-medium uppercase tracking-wider">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Dynamic Policies Section */}
          {(policies?.termsOfService || policies?.privacyPolicy) && (
            <div className="space-y-12 mb-20">
              {policies.termsOfService && (
                <motion.section
                  id="terms"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="bg-white rounded-[42px] shadow-xl p-8 md:p-12 border border-white">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-maphome-900">
                      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                        <ClipboardCheck className="size-8" />
                      </div>
                      Điều khoản Dịch vụ
                    </h2>
                    <div className="prose prose-slate max-w-none text-maphome-900 whitespace-pre-line leading-relaxed font-medium">
                      {policies.termsOfService}
                    </div>
                  </div>
                </motion.section>
              )}

              {policies.privacyPolicy && (
                <motion.section
                  id="privacy"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="bg-white rounded-[42px] shadow-xl p-8 md:p-12 border border-white">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-maphome-900">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                        <ShieldCheck className="size-8" />
                      </div>
                      Chính sách Bảo mật
                    </h2>
                    <div className="prose prose-slate max-w-none text-maphome-900 whitespace-pre-line leading-relaxed font-medium">
                      {policies.privacyPolicy}
                    </div>
                  </div>
                </motion.section>
              )}
            </div>
          )}

          {/* FAQ Section */}
          <motion.section
            id="faq"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-white">
              <h2 className="text-3xl font-bold mb-10 flex items-center gap-4 text-maphome-800">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-xl bg-blue-50"
                >
                  <MessageCircle className="size-8 text-blue-600" />
                </motion.div>
                Câu hỏi thường gặp (FAQ)
              </h2>

              <div className="space-y-12">
                {faqs.map((category, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-colors duration-300"
                  >
                    <h3 className="text-xl font-bold mb-6 text-maphome-700 flex items-center gap-2">
                      <motion.div
                        animate={{ height: [24, 28, 24] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 bg-gradient-to-b from-maphome-600 to-green-500 rounded-full"
                      />
                      {category.category}
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, qIdx) => (
                        <AccordionItem
                          key={qIdx}
                          value={`${idx}-${qIdx}`}
                          className="border-gray-100"
                        >
                          <AccordionTrigger className="text-left font-semibold hover:text-maphome-600 text-maphome-800 py-4 transition-colors">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-maphome-800 font-medium whitespace-pre-line leading-relaxed pb-6 pt-2">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Checklist Section */}
          <motion.section
            id="checklist"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-white">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-maphome-800">
                <motion.div
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-xl bg-maphome-50"
                >
                  <CheckCircle2 className="size-8 text-maphome-600" />
                </motion.div>
                Checklist Xem Nhà Trọ
              </h2>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-maphome-50 to-emerald-50 border-2 border-maphome-200 rounded-2xl p-6 mb-10 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-maphome-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <p className="text-maphome-800 leading-relaxed italic relative z-10 font-medium">
                  <strong className="text-maphome-700">
                    💡 Mẹo dân chuyên:
                  </strong>{" "}
                  In checklist này ra hoặc lưu vào ghi chú điện thoại. Kiểm tra
                  kỹ từng mục giúp bạn tránh được 90% các rắc rối thường gặp sau
                  khi dọn vào ở!
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {checklist.map((section, idx) => (
                  <motion.div key={idx} variants={fadeInUp}>
                    <Card className="p-6 h-full hover:shadow-2xl transition-all border-gray-100 hover:border-maphome-300 bg-gradient-to-br from-white to-maphome-50/10">
                      <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-maphome-800">
                        {section.title}
                      </h3>
                      <ul className="space-y-3">
                        {section.items.map((item, itemIdx) => (
                          <li
                            key={itemIdx}
                            className="flex items-start gap-3 group"
                          >
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              className="mt-1 flex-shrink-0"
                            >
                              <div className="size-5 border-2 border-gray-300 rounded-md group-hover:border-maphome-500 transition-all group-hover:bg-maphome-100 bg-white"></div>
                            </motion.div>
                            <span className="text-sm text-maphome-700 leading-snug group-hover:text-maphome-900 transition-colors">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mt-12 p-8 bg-gradient-to-br from-red-50/60 to-orange-50/40 border-2 border-red-200/60 rounded-3xl relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-0 right-0 w-64 h-64 bg-red-500/8 rounded-full -mr-32 -mt-32 blur-3xl"
                />
                <h3 className="font-extrabold text-xl mb-6 text-red-700 flex items-center gap-3">
                  <AlertCircle className="size-7" />
                  Cảnh báo: Dấu hiệu "Red-Flag" cần tránh
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Chủ nhà yêu cầu đặt cọc trước khi xem phòng",
                    "Không thể cung cấp giấy tờ nhà đất/CCCD hợp lệ",
                    "Giá rẻ bất thường so với thị trường khu vực",
                    "Phòng có dấu hiệu xuống cấp nặng, nấm mốc đen",
                    "Khu vực quá vắng vẻ, không có đèn đường về đêm",
                    "Chủ nhà né tránh việc làm hợp đồng chính thức",
                  ].map((warning, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-red-100 text-red-800 text-sm font-medium hover:bg-red-50 transition-all"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="size-2 rounded-full bg-red-500 flex-shrink-0"
                      />
                      {warning}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-12 text-center bg-gradient-to-br from-maphome-700 via-maphome-600 to-emerald-600 rounded-3xl shadow-2xl relative overflow-hidden group hover:shadow-2xl hover:shadow-maphome-600/40 transition-all duration-300">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              />
              <h2 className="text-3xl font-extrabold mb-4 relative z-10 text-white">
                Vẫn còn thắc mắc?
              </h2>
              <p className="mb-8 text-lg text-white max-w-xl mx-auto relative z-10 font-semibold">
                Đội ngũ hỗ trợ MapHome luôn sẵn sàng đồng hành cùng bạn 24/7 để
                tìm kiếm giải pháp tối ưu nhất.
              </p>
              <div className="flex gap-6 justify-center flex-wrap relative z-10">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-xl font-bold text-base transition-all bg-white hover:bg-white/95 active:bg-white/80 border-none shadow-lg"
                    style={{ color: "#15803d" }}
                  >
                    <Mail className="size-5 mr-3" />
                    support@maphome.vn
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-xl font-bold text-base transition-all bg-white/25 text-white border-2 border-white hover:bg-white/40 hover:border-white backdrop-blur-md"
                  >
                    <Phone className="size-5 mr-3" />
                    1900 xxxx
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
