import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import api from "@/app/utils/api";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Calendar,
  User,
  Clock,
  Eye,
  Search,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  TrendingUp,
  Tag,
  ChevronLeft,
  ChevronRight,
  Mail,
  Heart,
  MessageCircle,
  Share2,
  Plus,
} from "lucide-react";
import { Footer } from "@/app/components/Footer";
import { Navbar } from "@/app/components/Navbar";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { useAuth } from "@/app/contexts/AuthContext";
import { BlogEditorDialog } from "@/app/components/BlogEditorDialog";
import { toast } from "sonner";

// ─── Blog Data ────────────────────────────────────────────────
interface BlogPost {
  id: number | string;
  _id?: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  authorAvatar?: string;
  date: string;
  image?: string;
  category: string;
  readTime?: string;
  views?: number;
  likes?: number;
  comments?: number;
  tags?: string[];
  featured?: boolean;
}

const ALL_CATEGORIES = [
  "Tất cả",
  "Kinh nghiệm",
  "Hướng dẫn",
  "Thị trường",
  "Pháp luật",
  "Mẹo hay",
  "Tính năng",
];

const POPULAR_TAGS = [
  "tìm trọ",
  "sinh viên",
  "Hà Nội",
  "tiết kiệm",
  "pháp luật",
  "hợp đồng",
  "decor",
  "Trust is King",
  "thị trường",
  "mẹo hay",
];

const POSTS_PER_PAGE = 6;

// ─── Main Component ──────────────────────────────────────────
export function BlogPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<Set<number | string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/blogs");
        if (res.status === 200) {
          const data = res.data;
          setBlogs(data.map((b: any) => ({ ...b, id: b._id })));
        }
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedBlogs = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/api/blogs/me/saved");
        if (res.status === 200) {
          const savedIds = new Set<string | number>(res.data.map((b: any) => b._id));
          setBookmarked(savedIds);
        }
      } catch (err) {
        console.error("Failed to fetch saved blogs:", err);
      }
    };

    fetchBlogs();
    fetchSavedBlogs();
  }, [isAuthenticated]);

  const toggleBookmark = async (id: number | string) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu bài viết", {
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login")
        }
      });
      return;
    }

    try {
      const res = await api.post(`/api/blogs/${id}/save`);
      if (res.status === 200) {
        const { isSaved } = res.data;
        setBookmarked((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.success(isSaved ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết");
      }
    } catch (err) {
      toast.error("Không thể lưu bài viết. Vui lòng thử lại sau.");
    }
  };

  const handleCreateBlog = async (blogData: any) => {
    try {
      setIsSaving(true);
      const res = await api.post("/api/blogs", blogData);
      if (res.status === 201) {
        toast.success(
          blogData.status === "draft" 
            ? "Đã lưu bản nháp thành công! ✨" 
            : "Đã gửi bài viết! Chờ quản trị viên phê duyệt nhé. 🚀"
        );
        setIsEditorOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo bài viết");
    } finally {
      setIsSaving(false);
    }
  };

  // Featured post
  const featuredPost = blogs.find((p) => p.featured) || blogs[0];

  // Filtered posts (excluding featured from grid)
  const filteredPosts = useMemo(() => {
    if (!blogs.length) return [];

    return blogs
      .filter((p) => p.id !== (featuredPost?.id || featuredPost?._id))

      .filter(
        (p) => activeCategory === "Tất cả" || p.category === activeCategory,
      )
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      });
  }, [activeCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  // Popular posts (top 4 by views)
  const popularPosts = [...blogs]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ━━━ Hero Banner ━━━ */}
      <section className="relative bg-gradient-to-br from-maphome-700 via-emerald-600 to-green-600 text-white overflow-hidden py-14 md:py-20">
        {/* Animated background elements */}
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.08 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl opacity-20"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute bottom-10 right-10 w-96 h-96 bg-maphome-200 rounded-full blur-3xl opacity-15"
          />
        </motion.div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.span
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block bg-white/10 backdrop-blur-xl text-sm px-4 py-1.5 rounded-full mb-5 border border-white/30 hover:bg-white/20 transition-colors duration-300"
          >
            Blog MapHome
          </motion.span>
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
          >
            Kiến Thức & Kinh Nghiệm
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-maphome-100 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Chia sẻ thông tin hữu ích về việc tìm kiếm, thuê phòng trọ và cuộc
            sống tự lập tại Hà Nội
          </motion.p>
          {/* Search */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="max-w-xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-12 pr-4 h-12 rounded-full bg-white/95 text-gray-900 border-0 shadow-2xl backdrop-blur-sm text-base placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-maphome-300 transition-all duration-300 hover:bg-white"
            />
          </motion.div>

          {/* User Write Blog CTA */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-10"
          >
            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Vui lòng đăng nhập để viết bài");
                  navigate("/login");
                  return;
                }
                setIsEditorOpen(true);
              }}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/40 rounded-full px-8 h-12 font-bold group"
            >
              <Plus className="size-5 mr-2 group-hover:rotate-90 transition-transform" />
              Bạn muốn chia sẻ kinh nghiệm? Viết bài ngay
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ━━━ Featured Post ━━━ */}
      {featuredPost && (
        <motion.section
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 mb-10"
        >
          <article
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-2xl hover:shadow-maphome-500/10 transition-all duration-500"
            onClick={() => {}}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {featuredPost.image && (
                <div className="relative h-64 lg:h-auto overflow-hidden bg-gradient-to-br from-maphome-50 to-green-50">
                  <ImageWithFallback
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                  />
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg z-10"
                  >
                    Nổi bật
                  </motion.span>
                </div>
              )}
              <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <span className="bg-maphome-100 text-maphome-700 text-xs font-semibold px-3 py-1 rounded-full">
                    {featuredPost.category}
                  </span>
                  {featuredPost.readTime && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {featuredPost.readTime}
                    </span>
                  )}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, duration: 0.5 }}
                  className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-maphome-700 transition-colors leading-tight"
                >
                  {featuredPost.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 line-clamp-3"
                >
                  {featuredPost.excerpt}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.25, duration: 0.5 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maphome-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {featuredPost.authorAvatar || "A"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {featuredPost.author}
                      </p>
                      <p className="text-xs text-gray-400">
                        {featuredPost.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {(featuredPost.views || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3.5" />
                      {featuredPost.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="size-3.5" />
                      {featuredPost.comments || 0}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </article>
        </motion.section>
      )}

      {/* ━━━ Category Tabs ━━━ */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 mb-8"
      >
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {ALL_CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + idx * 0.05, duration: 0.4 }}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-maphome-600 to-emerald-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-maphome-50 hover:text-maphome-700"
                }
              `}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ━━━ Main Content ━━━ */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Blog Grid ── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {paginatedPosts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-20 bg-gradient-to-br from-maphome-50 to-green-50 rounded-2xl border-2 border-dashed border-maphome-200"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Search className="size-12 text-maphome-300 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-maphome-800 mb-2">
                    Không tìm thấy bài viết
                  </h3>
                  <p className="text-sm text-maphome-600">
                    Thử thay đổi từ khóa hoặc danh mục khác
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeCategory + searchQuery + currentPage}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {paginatedPosts.map((post) => (
                    <motion.article
                      key={post.id}
                      variants={{
                        hidden: { y: 30, opacity: 0 },
                        show: {
                          y: 0,
                          opacity: 1,
                          transition: {
                            duration: 0.5,
                            ease: "easeOut",
                          },
                        },
                      }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all duration-400 cursor-pointer group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-maphome-50 to-green-50">
                        {post.image && (
                          <ImageWithFallback
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        )}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 0.15 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg text-maphome-700 shadow-sm z-10"
                        >
                          {post.category}
                        </motion.span>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(post.id);
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-sm z-10"
                        >
                          {bookmarked.has(post.id) ? (
                            <BookmarkCheck className="size-4 text-maphome-600" />
                          ) : (
                            <Bookmark className="size-4 text-gray-500" />
                          )}
                        </motion.button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
                          {post.readTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5 text-blue-500" />
                              {post.readTime}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="size-3.5 text-maphome-500" />
                            {(post.views || 0).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-maphome-700 transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maphome-500 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                              {post.authorAvatar || "A"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">
                                {post.author}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {post.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <motion.span
                              className="flex items-center gap-1 group-hover:text-red-500 transition-colors"
                              whileHover={{ scale: 1.2 }}
                            >
                              <Heart className="size-3.5" />
                              {post.likes || 0}
                            </motion.span>
                            <motion.span
                              className="flex items-center gap-1 group-hover:text-blue-500 transition-colors"
                              whileHover={{ scale: 1.2 }}
                            >
                              <MessageCircle className="size-3.5" />
                              {post.comments || 0}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="h-9 w-9 border-maphome-300 text-maphome-700 hover:bg-maphome-50 hover:border-maphome-500"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </motion.div>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-9 w-9 rounded-lg font-medium text-sm transition-all duration-300 ${
                      currentPage === i + 1
                        ? "bg-gradient-to-r from-maphome-600 to-emerald-500 text-white shadow-lg"
                        : "border border-gray-200 text-gray-600 hover:border-maphome-300 hover:text-maphome-700 hover:bg-maphome-50"
                    }`}
                  >
                    {i + 1}
                  </motion.button>
                ))}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-9 w-9 border-maphome-300 text-maphome-700 hover:bg-maphome-50 hover:border-maphome-500"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Popular Posts */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="size-5 text-orange-500" />
                </motion.div>
                Bài viết phổ biến
              </h3>
              <div className="space-y-4">
                {popularPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + i * 0.08, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <motion.span
                      whileHover={{ scale: 1.15 }}
                      className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                      ${i === 0 ? "bg-orange-100 text-orange-600" : i === 1 ? "bg-blue-100 text-blue-600" : i === 2 ? "bg-maphome-100 text-maphome-600" : "bg-gray-100 text-gray-500"}
                    `}
                    >
                      {i + 1}
                    </motion.span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-maphome-700 transition-colors leading-snug">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <Eye className="size-3" />
                          {(post.views || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="size-3" />
                          {post.likes || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Newsletter */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-maphome-700 via-maphome-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl hover:shadow-maphome-600/40 transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4"
              >
                <Mail className="size-6 text-white" />
              </motion.div>
              <h3 className="font-bold text-lg mb-2 text-white">
                Nhận tin mới
              </h3>
              <p className="text-white/90 text-sm mb-5 leading-relaxed">
                Đăng ký để nhận bài viết mới nhất về kinh nghiệm tìm trọ và xu
                hướng thị trường
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="Email của bạn..."
                  className="bg-white/20 border border-white/40 text-white placeholder:text-white/60 h-11 rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0 focus-visible:border-white transition-all backdrop-blur-sm"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="w-full bg-white hover:bg-white/95 active:bg-white/80 h-11 font-bold text-base transition-all shadow-md hover:shadow-lg !text-maphome-700"
                    style={{ color: "#15803d" }}
                  >
                    Đăng ký
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Tag className="size-5 text-blue-500" />
                Tags phổ biến
              </h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag, idx) => (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.75 + idx * 0.03, duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery(tag);
                      setActiveCategory("Tất cả");
                      setCurrentPage(1);
                    }}
                    className="bg-maphome-50 hover:bg-maphome-100 hover:text-maphome-700 text-gray-600 text-xs px-3 py-1.5 rounded-full border border-maphome-200 hover:border-maphome-400 transition-all duration-300"
                  >
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="bg-gradient-to-br from-maphome-50 to-green-50 rounded-2xl p-5 border border-maphome-200 text-center shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="font-bold text-base mb-2 text-maphome-900">
                Bạn muốn đóng góp?
              </h3>
              <p className="text-sm text-maphome-700 mb-4">
                Chia sẻ kinh nghiệm tìm trọ, mẹo sống tiết kiệm cho cộng đồng
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="border-maphome-600 text-maphome-700 hover:bg-maphome-100"
                  variant="outline"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Vui lòng đăng nhập để viết bài");
                      navigate("/login");
                      return;
                    }
                    setIsEditorOpen(true);
                  }}
                >
                  Viết bài
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </motion.div>
            </motion.div>
          </aside>
        </div>
      </main>

      <BlogEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleCreateBlog}
      />

      <Footer />
    </div>
  );
}
