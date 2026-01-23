"use client";

import { useState } from "react";
import { FAQCategory } from "./FAQCategory";
import { FAQCTA } from "./FAQCTA";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategoryData {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategoryData[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "What is Hypertrading?",
        answer: "Hypertrading is a decentralized perpetual exchange that allows you to trade with up to 50x leverage on any asset. It's non-custodial, meaning you maintain full control of your funds at all times.",
      },
      {
        question: "How do I start trading?",
        answer: "To start trading, connect your Solana wallet (Phantom, Solflare, etc.), deposit USDC, select a trading pair, and place your first trade. No KYC required.",
      },
      {
        question: "What wallets are supported?",
        answer: "We support all major Solana wallets including Phantom, Solflare, Backpack, Ledger, and any WalletConnect compatible wallet.",
      },
      {
        question: "Is there a minimum deposit?",
        answer: "There's no minimum deposit required. However, we recommend starting with at least $100 to have sufficient margin for trading and fees.",
      },
    ],
  },
  {
    title: "Trading",
    items: [
      {
        question: "What is leverage trading?",
        answer: "Leverage trading allows you to control a larger position size with a smaller amount of capital. While this amplifies potential profits, it also increases the risk of losses.",
      },
      {
        question: "What are perpetual futures?",
        answer: "Perpetual futures are derivative contracts that track the price of an underlying asset without an expiration date. They use a funding rate mechanism to keep the price aligned with the spot market.",
      },
      {
        question: "How does liquidation work?",
        answer: "If your margin ratio falls below the maintenance margin requirement, your position will be liquidated. The liquidation price depends on your leverage and entry price, and is displayed before you open a position.",
      },
      {
        question: "What are the trading fees?",
        answer: "Maker orders are charged 0.02% and taker orders are charged 0.05%. High-volume traders and HYP stakers can receive discounts on trading fees.",
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        question: "Are my funds safe?",
        answer: "Yes, your funds are non-custodial, meaning they never leave your wallet. Our smart contracts have been audited by leading security firms, and we maintain a $50M insurance fund for additional protection.",
      },
      {
        question: "Has the protocol been audited?",
        answer: "Yes, Hypertrading has been audited by Trail of Bits, OpenZeppelin, and Certik. All audit reports are publicly available for review.",
      },
      {
        question: "What happens if there's a bug?",
        answer: "We have multiple layers of protection including an insurance fund, circuit breakers, and a guardian multisig. We also run a bug bounty program with rewards up to $1M for critical vulnerabilities.",
      },
    ],
  },
  {
    title: "Staking & Rewards",
    items: [
      {
        question: "What is HYP token?",
        answer: "HYP is the governance and utility token of Hypertrading. Holders can stake HYP to earn rewards, receive trading fee discounts, and participate in protocol governance.",
      },
      {
        question: "How do staking rewards work?",
        answer: "By staking HYP, you earn a share of protocol trading fees plus additional HYP rewards. The APY varies based on your staking tier and the total amount staked in the protocol.",
      },
      {
        question: "How does the referral program work?",
        answer: "When you refer friends to Hypertrading, you earn 20% of their trading fees as rewards. Your friends also receive a 5% discount on their trading fees.",
      },
    ],
  },
];

export const FAQContent = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            FAQ
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
          Find answers to common questions about trading on Hypertrading.
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8 sm:space-y-12">
        {faqData.map((category, index) => (
          <FAQCategory key={index} category={category} />
        ))}
      </div>

      {/* CTA Section */}
      <FAQCTA />
    </div>
  );
};



