"use client";

import { PrivacySection } from "./PrivacySection";

interface PrivacySectionData {
  number: number;
  title: string;
  content: string | string[];
}

const privacySections: PrivacySectionData[] = [
  {
    number: 1,
    title: "Introduction",
    content:
      "Hypertrading is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our decentralized trading platform. Please read this policy carefully to understand our practices regarding your personal information.",
  },
  {
    number: 2,
    title: "Information We Collect",
    content: [
      "Wallet Addresses: We collect public blockchain addresses associated with your wallet when you interact with our platform.",
      "Transaction Data: We collect publicly available on-chain information related to your transactions.",
      "Usage Data: We collect anonymous analytics data about how you use our platform to improve our services.",
      "Communication Data: We collect information you provide when contacting our support team or participating in our community.",
    ],
  },
  {
    number: 3,
    title: "How We Use Your Information",
    content: [
      "Provide, maintain, and improve the Service",
      "Process transactions and send related information",
      "Respond to comments, questions, and support requests",
      "Monitor and analyze trends, usage, and activities",
      "Detect, investigate, and prevent fraudulent transactions and abuse",
    ],
  },
  {
    number: 4,
    title: "Information Sharing",
    content:
      "We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances: to comply with legal obligations, to protect our rights and safety, with your consent, or with service providers who assist us in operating our platform.",
  },
  {
    number: 5,
    title: "Blockchain Data",
    content:
      "Blockchain transactions are public by nature. This means that your wallet addresses and transaction history are visible to anyone on the blockchain. Hypertrading cannot control or delete information that has been recorded on a public blockchain.",
  },
  {
    number: 6,
    title: "Cookies and Tracking",
    content:
      "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.",
  },
  {
    number: 7,
    title: "Data Security",
    content:
      "We implement technical and organizational security measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    number: 8,
    title: "Your Rights",
    content:
      "Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. To exercise these rights, please contact us using the information provided below.",
  },
  {
    number: 9,
    title: "Contact Us",
    content:
      "If you have any questions about this Privacy Policy, please contact us at privacy@hypertrading.io.",
  },
];

export const PrivacyContent = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header Section */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Last updated: January 22, 2026
        </p>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-8 sm:space-y-10">
        {privacySections.map((section) => (
          <PrivacySection key={section.number} section={section} />
        ))}
      </div>
    </div>
  );
};

