"use client";

import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";
import { ROUTES } from "@/lib/config";

export const FAQCTA = () => {
  const handleContactSupport = () => {
    window.location.href = ROUTES.SUPPORT;
  };

  return (
    <div className="mt-12 sm:mt-16 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
        Still have questions?
      </h2>
      <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8">
        Our support team is here to help 24/7.
      </p>
      <AppButton
        variant={VARIANT_TYPES.NOT_SELECTED}
        className="bg-green-500 text-white hover:bg-green-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg transition-colors"
        onClick={handleContactSupport}
      >
        Contact Support
      </AppButton>
    </div>
  );
};



