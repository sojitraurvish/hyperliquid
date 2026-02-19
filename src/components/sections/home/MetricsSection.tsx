"use client";

import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  index: number;
}

const MetricCard = ({ title, value, change, icon, index }: MetricCardProps) => (
  <motion.div
    whileInView={{ opacity: [0.3, 1], y: [20, 0] }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" as const }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group relative"
  >
    <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-6 sm:p-8 hover:border-green-500/30 transition-all duration-500">
      <div className="flex items-start justify-between mb-5">
        <div className="text-gray-400 text-sm font-medium tracking-wide uppercase">{title}</div>
        <div className="p-2 bg-green-500/10 rounded-xl text-green-400 group-hover:bg-green-500/20 transition-colors duration-300">
          {icon}
        </div>
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-white mb-3 font-mono tracking-tight">{value}</div>
      <div className="text-sm text-green-400 font-medium flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        {change}
      </div>
    </div>
  </motion.div>
);

export const MetricsSection = () => {
  const metrics = [
    { title: '24h Trading Volume', value: '$1.09B', change: '+12.5%', icon: <TrendingUp className="w-5 h-5" /> },
    { title: 'Total Value Locked', value: '$458M', change: '+8.2%', icon: <DollarSign className="w-5 h-5" /> },
    { title: 'Active Traders', value: '125,000+', change: '+5,200 this week', icon: <Users className="w-5 h-5" /> },
    { title: 'Open Interest', value: '$892M', change: '+3.8%', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <section className="w-full bg-gray-950 py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-gray-950 via-gray-950/95 to-gray-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/4 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold text-green-400 tracking-widest uppercase mb-3">Platform Metrics</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">Real-time statistics from our decentralized exchange</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
