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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header Section */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Last updated: January 22, 2026
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-8 sm:space-y-10">
        {termsSections.map((section) => (
          <TermsSection key={section.number} section={section} />
        ))}
      </div>
    </div>
  );
};

