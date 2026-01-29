"use client";

import { useState } from "react";
import { BlogPostCard } from "./BlogPostCard";
import { BlogCategoryFilter } from "./BlogCategoryFilter";

export type BlogCategory = "all" | "market-analysis" | "education" | "product" | "trading" | "research";

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  category: BlogCategory;
  date: string;
  image: string;
  imageAlt: string;
  url: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Bitcoin Breaks $100K: What's Next for Crypto?",
    description: "Analyzing the factors behind Bitcoin's historic rally and what it means for the broader cryptocurrency market.",
    category: "market-analysis",
    date: "Jan 20, 2026",
    image: "/blog/bitcoin-100k.jpg",
    imageAlt: "Bitcoin breaks 100k crypto news",
    url: "https://cointelegraph.com/tags/bitcoin",
  },
  {
    id: "2",
    title: "Understanding DeFi Perpetual Swaps",
    description: "A comprehensive guide to trading perpetual futures on decentralized exchanges.",
    category: "education",
    date: "Jan 18, 2026",
    image: "/blog/defi-perpetual.jpg",
    imageAlt: "DeFi perpetual swaps guide",
    url: "https://www.coindesk.com/learn/what-are-perpetual-swaps/",
  },
  {
    id: "3",
    title: "Advanced Trading Strategies for 2026",
    description: "Learn professional trading techniques including delta-neutral strategies and funding rate arbitrage.",
    category: "trading",
    date: "Jan 15, 2026",
    image: "/blog/trading-strategies.jpg",
    imageAlt: "Advanced trading strategies",
    url: "https://www.investopedia.com/trading/strategies-for-trading-futures-5080150",
  },
  {
    id: "4",
    title: "Hypertrading v2.0: New Features Announced",
    description: "Introducing cross-margin, portfolio margin, and 20 new trading pairs in our biggest update yet.",
    category: "product",
    date: "Jan 12, 2026",
    image: "/blog/hypertrading-v2.jpg",
    imageAlt: "Hypertrading v2.0 features",
    url: "https://blog.hyperliquid.xyz/",
  },
  {
    id: "5",
    title: "Risk Management for Leverage Traders",
    description: "Essential risk management principles for trading with leverage on perpetual markets.",
    category: "education",
    date: "Jan 10, 2026",
    image: "/blog/risk-management.jpg",
    imageAlt: "Risk management for leverage traders",
    url: "https://www.investopedia.com/articles/trading/09/risk-management.asp",
  },
  {
    id: "6",
    title: "The State of Solana DeFi in 2026",
    description: "A deep dive into the Solana DeFi ecosystem and the protocols driving innovation.",
    category: "research",
    date: "Jan 8, 2026",
    image: "/blog/solana-defi.jpg",
    imageAlt: "Solana DeFi ecosystem",
    url: "https://www.coindesk.com/tag/solana/",
  },
];

export const BlogContent = () => {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>("all");

  const filteredPosts =
    selectedCategory === "all"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            Blog
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Insights & Updates
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
          Stay informed with the latest market analysis, trading strategies, and platform updates.
        </p>
      </div>

      {/* Category Filters */}
      <BlogCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
        {filteredPosts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};




