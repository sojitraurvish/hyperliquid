"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import AppButton from '@/components/ui/button';
import { VARIANT_TYPES } from '@/lib/constants';
import { ROUTES } from '@/lib/config';

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" as const }}
  />
);

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Grid background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <FloatingOrb className="w-[600px] h-[600px] bg-green-500/[0.07] top-[-15%] left-[-10%]" delay={0} />
      <FloatingOrb className="w-[500px] h-[500px] bg-emerald-500/6 bottom-[5%] right-[-8%]" delay={2} />
      <FloatingOrb className="w-[350px] h-[350px] bg-green-400/4 top-[35%] left-[55%]" delay={4} />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.5)_50%,rgba(3,7,18,0.95)_100%)]" />

      {/* Animated vertical line accents */}
      <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none">
        {[12, 30, 50, 70, 88].map((left, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-linear-to-b from-transparent via-green-400/60 to-transparent"
            style={{ left: `${left}%`, height: '120%', top: '-10%' }}
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" as const }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)' }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center px-5 py-2.5 mb-8 bg-green-500/10 border border-green-500/20 rounded-full backdrop-blur-sm transition-all duration-700 delay-100"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <motion.span
            className="w-2 h-2 bg-green-400 rounded-full mr-3"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm sm:text-base text-green-400 font-medium tracking-wide">
            Trade with up to 50x leverage
          </span>
        </div>

        {/* Main Heading */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-[1.05] tracking-tight transition-all duration-700 delay-200"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span className="block">The Most Advanced</span>
          <span className="block mt-2 bg-linear-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent">
            Decentralized
          </span>
          <span className="block mt-2">Perpetual Exchange</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
        >
          Trade any asset with deep liquidity, low fees, and lightning-fast execution.
          Built for professional traders, accessible to everyone.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-400"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <Link href={ROUTES.TRADE} className="w-full sm:w-auto">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white px-10 py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
              >
                Start Trading
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </AppButton>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-10 py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm justify-center"
            >
              Learn More
            </AppButton>
          </motion.div>
        </div>

        {/* Trust indicators */}
        <div
          className="mt-10 sm:mt-14 md:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-gray-500 text-sm transition-all duration-700 delay-500"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          {[
            { label: "24h Volume", value: "$1.09B+" },
            { label: "Active Traders", value: "125K+" },
            { label: "Total Trades", value: "50M+" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-white font-semibold font-mono">{stat.value}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-700 delay-800"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-3 bg-white/40 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }}
          />
        </motion.div>
      </div>
    </section>
  );
};
