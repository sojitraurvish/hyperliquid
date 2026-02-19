"use client";

import { ContactInformation } from "./ContactInformation";
import { ContactForm } from "./ContactForm";

export const SupportContent = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-sm font-semibold text-green-400 tracking-widest uppercase mb-4 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            Contact
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">
            Get in{' '}
            <span className="bg-linear-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Have a question or want to partner with us? We'd love to hear from you.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          <div>
            <ContactInformation />
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};
