"use client";

import { TermsSection } from "./TermsSection";

interface TermsSectionData {
  number: number;
  title: string;
  content: string | string[];
}

const termsSections: TermsSectionData[] = [
  {
    number: 1,
    title: "Acceptance of Terms",
    content:
      "By accessing or using the Hypertrading platform (the 'Service'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, you may not access or use the Service.",
  },
  {
    number: 2,
    title: "Eligibility",
    content:
      "You must be at least 18 years old and have the legal capacity to enter into these Terms. The Service is not available in jurisdictions where cryptocurrency trading is prohibited.",
  },
  {
    number: 3,
    title: "Account Responsibilities",
    content:
      "You are responsible for maintaining the security of your wallet and private keys. Hypertrading is a non-custodial platform and does not have access to your private keys or the ability to recover lost access. You are solely responsible for all activities that occur under your wallet address.",
  },
  {
    number: 4,
    title: "Trading Risks",
    content:
      "Trading cryptocurrencies and derivatives involves substantial risk of loss and is not suitable for all investors. You should carefully consider whether trading is suitable for you in light of your financial condition. Leverage amplifies both gains and losses, and you may lose your entire initial investment.",
  },
  {
    number: 5,
    title: "Prohibited Activities",
    content: [
      "Use the Service for any illegal purpose or in violation of applicable laws.",
      "Engage in market manipulation, wash trading, or spoofing.",
      "Attempt to disrupt or compromise the integrity of the Service.",
      "Use automated systems to exploit the platform.",
      "Provide false or misleading information.",
    ],
  },
  {
    number: 6,
    title: "Intellectual Property",
    content:
      "All content, trademarks, and intellectual property on the Service are owned by Hypertrading or its licensors. You may not copy, modify, or distribute any content without prior written consent.",
  },
  {
    number: 7,
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by law, Hypertrading shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues, data, use, goodwill, or other intangible losses resulting from your use of the Service.",
  },
  {
    number: 8,
    title: "Changes to Terms",
    content:
      "Hypertrading reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website. Your continued use of the Service after such changes constitutes acceptance of the new Terms.",
  },
  {
    number: 9,
    title: "Contact",
    content:
      "If you have any questions about these Terms, please contact us at legal@hypertrading.io.",
  },
];

export const TermsContent = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-green-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="mb-10 sm:mb-14">
          <span className="inline-block text-sm font-semibold text-green-400 tracking-widest uppercase mb-4 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Last updated: January 22, 2026
          </p>
        </div>

        <div className="space-y-5 sm:space-y-8 md:space-y-10">
          {termsSections.map((section) => (
            <TermsSection key={section.number} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
};
