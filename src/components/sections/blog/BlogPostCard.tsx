"use client";

import { Calendar } from "lucide-react";
import { BlogPost } from "./index";

interface BlogPostCardProps {
  post: BlogPost;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "market-analysis":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "education":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "trading":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "product":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "research":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "market-analysis":
      return "Market Analysis";
    case "education":
      return "Education";
    case "trading":
      return "Trading";
    case "product":
      return "Product";
    case "research":
      return "Research";
    default:
      return category;
  }
};

export const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const handleClick = () => {
    window.open(post.url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300 hover:shadow-xl cursor-pointer group">
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Placeholder for blog image - will be replaced with actual images */}
          <div className="w-full h-full relative">
            {post.image.includes("bitcoin") && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20">
                <div className="absolute top-4 left-4 text-white font-bold text-2xl sm:text-3xl">
                  CRYPTO NEWS
                </div>
                <div className="absolute bottom-4 right-4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-500 rounded-full flex items-center justify-center transform rotate-12">
                  <span className="text-gray-900 font-bold text-2xl sm:text-4xl">₿</span>
                </div>
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-500/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-red-500/20 to-transparent" />
                </div>
              </div>
            )}
            {post.image.includes("defi") && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-600/30">
                <div className="absolute top-4 right-4 text-white font-bold text-3xl sm:text-4xl">
                  DeFi
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-cyan-400 rounded-full opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-cyan-300 rounded-full opacity-70" />
                  </div>
                </div>
                <div className="absolute inset-0">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                      style={{
                        top: `${20 + i * 15}%`,
                        left: `${15 + i * 12}%`,
                        animation: `pulse 2s ease-in-out infinite ${i * 0.3}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {post.image.includes("trading") && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full h-full relative">
                    {/* Simulated candlestick chart */}
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 grid grid-cols-8 gap-1">
                      {[...Array(16)].map((_, i) => {
                        const isGreen = i % 3 !== 0;
                        const height = 30 + (i % 5) * 10;
                        return (
                          <div
                            key={i}
                            className={`${isGreen ? "bg-green-500" : "bg-red-500"} rounded-sm`}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center opacity-70">
                      <span className="text-gray-900 text-xs font-bold">↑</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {post.image.includes("hypertrading") && (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20">
                <div className="absolute top-4 left-4 text-white font-bold text-2xl sm:text-3xl">
                  CRYPTO NEWS
                </div>
                <div className="absolute bottom-4 right-4 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-500 rounded-full flex items-center justify-center transform rotate-12">
                  <span className="text-gray-900 font-bold text-2xl sm:text-4xl">₿</span>
                </div>
              </div>
            )}
            {post.image.includes("risk") && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full h-full relative">
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 grid grid-cols-8 gap-1">
                      {[...Array(16)].map((_, i) => {
                        const isGreen = i % 3 !== 0;
                        const height = 30 + (i % 5) * 10;
                        return (
                          <div
                            key={i}
                            className={`${isGreen ? "bg-green-500" : "bg-red-500"} rounded-sm`}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {post.image.includes("solana") && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-600/30">
                <div className="absolute top-4 right-4 text-white font-bold text-3xl sm:text-4xl">
                  DeFi
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-purple-400 rounded-full opacity-50" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6" onClick={handleClick}>
        {/* Category and Date */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
              post.category
            )}`}
          >
            {getCategoryLabel(post.category)}
          </span>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{post.date}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-green-400 transition-colors">
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3">
          {post.description}
        </p>

        {/* Read More Link */}
        <div className="flex items-center text-green-400 hover:text-green-300 font-medium text-sm sm:text-base transition-colors">
          <span>Read more</span>
          <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
        </div>
      </div>
    </article>
  );
};

