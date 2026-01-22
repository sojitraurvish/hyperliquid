"use client";

import { ContactInformation } from "./ContactInformation";
import { ContactForm } from "./ContactForm";

export const SupportContent = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            Contact
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Get in Touch
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
          Have a question or want to partner with us? We'd love to hear from you.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        {/* Left Column - Contact Information */}
        <div>
          <ContactInformation />
        </div>

        {/* Right Column - Contact Form */}
        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

