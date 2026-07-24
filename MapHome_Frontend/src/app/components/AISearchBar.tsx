import React, { useState } from "react";
import { Search, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AISearchBarProps {
  onSearch: (query: string) => Promise<void>;
  placeholder?: string;
}

export const AISearchBar: React.FC<AISearchBarProps> = ({
  onSearch,
  placeholder = "Tìm trọ theo giá, tiện nghi...",
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      await onSearch(query.trim());
      setQuery("");
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center w-full group transition-all duration-300",
        isSearching ? "opacity-80" : "opacity-100"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center w-full bg-white/60 border border-emerald-900/10 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl px-2 py-1.5 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          {isSearching ? (
            <Loader2 className="size-5 text-emerald-600 animate-spin" />
          ) : (
            <Sparkles className="size-5 text-emerald-600" />
          )}
        </div>


        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!query.trim() || isSearching}
          className="flex items-center justify-center w-10 h-10 shrink-0 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRight className="size-5" />
        </motion.button>
      </div>
    </form>
  );
};
