import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/app/utils/api";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ArrowLeft, Clock, Eye, Heart, MessageCircle, Bookmark, BookmarkCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";

export function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/blogs/${id}`);
        setBlog(res.data);
      } catch (err) {
        toast.error("Không thể tải bài viết");
        navigate("/blog");
      } finally {
        setLoading(false);
      }
    };

    const checkSaved = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get("/api/blogs/me/saved");
        const savedIds = new Set<string | number>(res.data.map((b: any) => b._id));
        if (savedIds.has(id as string)) {
          setIsSaved(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (id) {
      fetchBlog();
      checkSaved();
    }
  }, [id, isAuthenticated, navigate]);

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu bài viết", {
        action: { label: "Đăng nhập", onClick: () => navigate("/login") }
      });
      return;
    }
    try {
      const res = await api.post(`/api/blogs/${id}/save`);
      setIsSaved(res.data.isSaved);
      toast.success(res.data.isSaved ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết");
    } catch (err) {
      toast.error("Không thể lưu bài viết");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Back Button */}
        <button 
          onClick={() => navigate("/blog")}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm">Quay lại danh sách</span>
        </button>

        {/* Article Header */}
        <header className="mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {blog.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="size-3.5" />
              {blog.date}
            </span>
            {blog.readTime && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Clock className="size-3.5" />
                {blog.readTime}
              </span>
            )}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            {blog.title}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between py-6 border-y border-slate-200/60"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {blog.authorAvatar || blog.author?.charAt(0) || "A"}
              </div>
              <div>
                <p className="font-bold text-slate-900">{blog.author || "Tác giả ẩn danh"}</p>
                <p className="text-xs text-slate-500">Quản trị viên / Tác giả</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-slate-500 text-sm font-semibold mr-4">
                <span className="flex items-center gap-1.5"><Eye className="size-4" /> {(blog.views || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1.5"><Heart className="size-4" /> {blog.likes || 0}</span>
              </div>
              <button 
                onClick={toggleBookmark}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSaved ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {isSaved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
              </button>
            </div>
          </motion.div>
        </header>

        {/* Featured Image */}
        {blog.image && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden mb-12 shadow-xl shadow-slate-200/50"
          >
            <ImageWithFallback 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="prose prose-slate md:prose-lg prose-emerald max-w-none w-full bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100"
        >
          {/* Note: since content might be raw text or HTML depending on backend, we use dangerouslySetInnerHTML */}
          <div dangerouslySetInnerHTML={{ __html: blog.content || blog.excerpt || "Chưa có nội dung chi tiết." }} />
        </motion.article>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-12 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-500 mr-2">Tags:</span>
            {blog.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
