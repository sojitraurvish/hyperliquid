"use client";

import { motion } from 'framer-motion';
import { Wallet, ArrowRightLeft, TrendingUp, BadgeDollarSign } from 'lucide-react';

const steps = [
  { icon: <Wallet className="w-7 h-7" />, step: "01", title: "Connect Wallet", description: "Connect your preferred wallet in seconds. No registration, no KYC. Your keys, your control." },
  { icon: <BadgeDollarSign className="w-7 h-7" />, step: "02", title: "Deposit Funds", description: "Deposit USDC to start trading. Transfer between spot and perps accounts with zero fees." },
  { icon: <ArrowRightLeft className="w-7 h-7" />, step: "03", title: "Place a Trade", description: "Choose your asset, set your leverage, and execute market or limit orders instantly." },
  { icon: <TrendingUp className="w-7 h-7" />, step: "04", title: "Manage & Profit", description: "Set TP/SL, monitor positions in real-time, and withdraw your profits anytime." },
];

export const HowItWorksSection = () => (
  <section className="w-full bg-gray-950 py-12 sm:py-20 md:py-28 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-800 to-transparent" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10 sm:mb-16 md:mb-20">
        <span className="inline-block text-sm font-semibold text-green-400 tracking-widest uppercase mb-4 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
          Getting Started
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
          Start Trading in{' '}
          <span className="bg-linear-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">4 Simple Steps</span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          From wallet connection to your first trade in under a minute.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        <div className="hidden lg:block absolute top-[72px] left-[12%] right-[12%] h-px bg-linear-to-r from-green-500/20 via-green-500/40 to-green-500/20" />

        {steps.map((step, index) => (
          <motion.div
            key={index}
            whileInView={{ opacity: [0.3, 1], y: [30, 0] }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" as const }}
            className="relative group text-center"
          >
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-[72px] h-[72px] bg-green-500/10 rounded-2xl rotate-45 group-hover:rotate-60 group-hover:bg-green-500/20 transition-all duration-500" />
              <div className="relative w-[72px] h-[72px] flex items-center justify-center text-green-400">{step.icon}</div>
            </div>
            <div className="text-xs font-bold text-green-400/60 tracking-widest uppercase mb-2">Step {step.step}</div>
            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-green-50 transition-colors">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[260px] mx-auto group-hover:text-gray-300 transition-colors">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
