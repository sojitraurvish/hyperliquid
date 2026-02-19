"use client";

import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";
import { ROUTES } from "@/lib/config";

export const FAQCTA = () => {
  const handleContactSupport = () => {
    window.location.href = ROUTES.SUPPORT;
  };

  return (
    <div className="mt-14 sm:mt-20">
      <div className="relative rounded-2xl sm:rounded-3xl border border-gray-800/50 bg-gray-900/20 backdrop-blur-sm p-6 sm:p-8 md:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
            Still have questions?
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
            Our support team is here to help 24/7.
          </p>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white px-8 py-3.5 text-base font-semibold rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] justify-center"
            onClick={handleContactSupport}
          >
            Contact Support
          </AppButton>
        </div>
      </div>
    </div>
  );
};
