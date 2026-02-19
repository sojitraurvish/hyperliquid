"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import AppButton from '@/components/ui/button';
import { VARIANT_TYPES } from '@/lib/constants';
import { REFERRAL_URL, ROUTES } from '@/lib/config';

export const CTASection = () => (
  <section className="w-full bg-gray-950 py-14 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.05)_0%,transparent_50%)]" />

    <motion.div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)' }}
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
    />

    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        whileInView={{ opacity: [0.3, 1], y: [20, 0] }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" as const }}
        className="relative rounded-3xl border border-gray-800/50 bg-gray-900/20 backdrop-blur-sm p-6 sm:p-10 md:p-14 lg:p-20 text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)]" />

        {[
          { top: '15%', left: '8%', size: 3 },
          { top: '70%', right: '12%', size: 2 },
          { top: '30%', right: '5%', size: 4 },
          { bottom: '20%', left: '15%', size: 2.5 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute bg-green-400/40 rounded-full"
            style={{ ...dot, width: `${dot.size}px`, height: `${dot.size}px` }}
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}

        <div className="relative">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">
            Ready to Start{' '}
            <span className="bg-linear-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Trading?</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join over 125,000 traders and experience the future of decentralized trading today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.TRADE} className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white px-10 py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] justify-center"
                >
                  Launch App
                </AppButton>
              </motion.div>
            </Link>
            <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <AppButton
                  variant={VARIANT_TYPES.NOT_SELECTED}
                  className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-10 py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm justify-center"
                >
                  Refer & Earn
                </AppButton>
              </motion.div>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
