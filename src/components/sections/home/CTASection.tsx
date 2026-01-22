import Link from 'next/link';
import AppButton from '@/components/ui/button';
import { VARIANT_TYPES } from '@/lib/constants';
import { REFERRAL_URL, ROUTES } from '@/lib/config';

export const CTASection = () => {
  return (
    <section className="w-full bg-gray-950 py-16 sm:py-20 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
          Ready to Start Trading?
        </h2>
        <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Join over 125,000 traders and experience the future of decentralized trading today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={ROUTES.TRADE}>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Launch App
            </AppButton>
          </Link>
          <a href={REFERRAL_URL} target="_blank" rel="noopener noreferrer">
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200"
            >
              Refer & Earn
            </AppButton>
          </a>
        </div>
      </div>
    </section>
  );
};

