"use client";

import { Zap, TrendingUp, Shield, BarChart3, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  gradient: string;
}

const FeatureCard = ({ icon, title, description, index, gradient }: FeatureCardProps) => (
  <motion.div
    whileInView={{ opacity: [0.3, 1], y: [30, 0] }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" as const }}
    whileHover={{ y: -6, transition: { duration: 0.25 } }}
    className="group relative"
  >
    <div className="absolute -inset-px bg-linear-to-br from-green-500/20 via-transparent to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
    <div className="relative h-full bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-5 sm:p-7 md:p-8 hover:border-green-500/30 transition-all duration-500 overflow-hidden">
      <div className={`absolute top-0 right-0 w-40 h-40 ${gradient} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative">
        <div className="inline-flex p-3.5 bg-green-500/10 rounded-xl text-green-400 mb-6 group-hover:bg-green-500/20 transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-50 transition-colors duration-300">{title}</h3>
        <p className="text-gray-400 text-sm sm:text-[15px] leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{description}</p>
      </div>
    </div>
  </motion.div>
);

export const FeaturesSection = () => {
  const features = [
    { icon: <Zap className="w-7 h-7" />, title: 'Lightning Fast Execution', description: 'Sub-second trade execution with our high-performance matching engine. No more slippage or failed transactions.', gradient: 'bg-linear-to-bl from-yellow-500/5 to-transparent' },
    { icon: <TrendingUp className="w-7 h-7" />, title: 'Up to 50x Leverage', description: 'Amplify your trading power with industry-leading leverage options while maintaining full control over your risk.', gradient: 'bg-linear-to-bl from-green-500/5 to-transparent' },
    { icon: <Shield className="w-7 h-7" />, title: 'Self-Custody Trading', description: 'Your keys, your crypto. Trade directly from your wallet without ever giving up control of your assets.', gradient: 'bg-linear-to-bl from-blue-500/5 to-transparent' },
    { icon: <BarChart3 className="w-7 h-7" />, title: 'Deep Liquidity', description: 'Access to billions in liquidity across all major trading pairs. Trade large sizes with minimal slippage.', gradient: 'bg-linear-to-bl from-purple-500/5 to-transparent' },
    { icon: <Lock className="w-7 h-7" />, title: 'Enterprise Security', description: 'Multi-signature infrastructure, regular audits, and insurance funds to protect your assets.', gradient: 'bg-linear-to-bl from-red-500/5 to-transparent' },
    { icon: <Globe className="w-7 h-7" />, title: '24/7 Global Access', description: 'Trade anytime, anywhere. Our platform never sleeps, giving you access to markets around the clock.', gradient: 'bg-linear-to-bl from-cyan-500/5 to-transparent' },
  ];

  return (
    <section className="w-full bg-gray-950 py-14 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-green-500/3 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/3 rounded-full blur-3xl translate-x-1/2 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16 md:mb-20">
          <span className="inline-block text-sm font-semibold text-green-400 tracking-widest uppercase mb-4 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">
            Why Traders Choose{' '}
            <span className="bg-linear-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Hypertrading</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Experience the future of decentralized trading with our cutting-edge features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
