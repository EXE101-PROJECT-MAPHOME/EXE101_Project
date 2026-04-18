import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface BlogEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const BlogEditorDialog = ({ isOpen, onClose, onSave, initialData }: BlogEditorDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "Tin tức",
    excerpt: "",
    content: "",
    image: "",
    tags: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        category: initialData.category || "Tin tức",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        image: initialData.image || "",
        tags: initialData.tags?.join(", ") || "",
      });
    } else {
      setFormData({
        title: "",
        category: "Tin tức",
        excerpt: "",
        content: "",
        image: "",
        tags: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {initialData ? "Chỉnh sửa bài viết" : "Viết bài mới"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
               <LogOut className="size-6 text-slate-400 rotate-180" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Tiêu đề bài viết</label>
              <input 
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none"
                placeholder="Ví dụ: 10 mẹo thuê phòng trọ giá rẻ..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Danh mục</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Tin tức</option>
                  <option>Mẹo thuê phòng</option>
                  <option>Review nhà</option>
                  <option>Đời sống</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Tags (cách nhau bởi dấu phẩy)</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none"
                  placeholder="Review, Phòng trọ, Quận 1"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Link ảnh bìa (URL)</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={e => setFormData({...formData, image: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Tóm tắt ngắn gọn</label>
              <textarea 
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none h-24 resize-none"
                placeholder="Mô tả ngắn gọn nội dung bài viết..."
                value={formData.excerpt}
                onChange={e => setFormData({...formData, excerpt: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Nội dung chi tiết</label>
              <textarea 
                required
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-[32px] text-sm font-bold focus:ring-2 ring-indigo-500 transition-all outline-none h-64 resize-none"
                placeholder="Viết nội dung bài viết của bạn tại đây..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>
          </form>

          <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-end gap-3">
             <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl font-black px-8">Hủy</Button>
             <div className="flex gap-2">
               <Button 
                 type="button" 
                 variant="outline"
                 onClick={() => onSave({ ...formData, status: "draft" })} 
                 className="border-slate-200 text-slate-600 rounded-2xl font-black px-8 h-12"
               >
                 Lưu nháp
               </Button>
               <Button 
                type="submit" 
                onClick={handleSubmit} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-10 h-12 shadow-lg shadow-indigo-100"
              >
                {initialData ? "Cập nhật bài viết" : "Xuất bản ngay"}
               </Button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
