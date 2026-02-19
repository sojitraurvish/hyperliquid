"use client";

import Link from 'next/link';
import { Twitter, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES, EXTERNAL_URLS } from '@/lib/config';

const existingPages = new Set([
  ROUTES.HOME,
  ROUTES.TRADE,
  ROUTES.MARKETS,
  ROUTES.PORTFOLIO,
  ROUTES.FAQ,
  ROUTES.SUPPORT,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
]);

const LinkColumn = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
  <div>
    <h3 className="text-gray-300 font-semibold mb-3 sm:mb-4 text-xs tracking-widest uppercase">{title}</h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className="text-gray-500 hover:text-green-400 transition-colors duration-200 text-sm">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  const platformLinks = [
    { label: 'Trade', href: ROUTES.TRADE },
    { label: 'Markets', href: ROUTES.MARKETS },
    { label: 'Portfolio', href: ROUTES.PORTFOLIO },
  ].filter((l) => existingPages.has(l.href));

  const resourcesLinks = [
    { label: 'FAQ', href: ROUTES.FAQ },
    { label: 'Support', href: ROUTES.SUPPORT },
  ].filter((l) => existingPages.has(l.href));

  const companyLinks = [
    { label: 'Contact', href: ROUTES.SUPPORT },
  ].filter((l) => existingPages.has(l.href));

  const legalLinks = [
    { label: 'Terms of Service', href: ROUTES.TERMS },
    { label: 'Privacy Policy', href: ROUTES.PRIVACY },
  ].filter((l) => existingPages.has(l.href));

  const socialLinks = [
    { icon: <Twitter className="w-4 h-4" />, href: EXTERNAL_URLS.TWITTER, label: "Twitter" },
    { icon: <MessageCircle className="w-4 h-4" />, href: EXTERNAL_URLS.DISCORD, label: "Discord" },
    { icon: <Mail className="w-4 h-4" />, href: EXTERNAL_URLS.SUPPORT_EMAIL, label: "Email" },
    { icon: <ExternalLink className="w-4 h-4" />, href: EXTERNAL_URLS.GITHUB, label: "GitHub" },
  ];

  return (
    <footer className="w-full bg-gray-950 border-t border-gray-800/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-green-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-16">

        {/* Mobile: stacked layout / Desktop: side by side */}
        <div className="lg:flex lg:gap-16">

          {/* Brand section */}
          <div className="lg:max-w-xs lg:shrink-0 mb-10 lg:mb-0">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-3">
              <div className="w-8 h-8 bg-linear-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/15">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-lg text-white tracking-tight">Hypertrading</span>
            </div>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-5 text-center sm:text-left max-w-xs mx-auto sm:mx-0">
              The most advanced decentralized perpetual exchange. Trade with up to 50x leverage on any asset.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-gray-800/40 border border-gray-800/60 text-gray-500 hover:text-green-400 hover:border-green-500/20 hover:bg-green-500/5 transition-all duration-200 flex items-center justify-center"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Divider on mobile only */}
          <div className="h-px bg-gray-800/50 mb-8 lg:hidden" />

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:flex-1">
            <LinkColumn title="Platform" links={platformLinks} />
            <LinkColumn title="Resources" links={resourcesLinks} />
            {companyLinks.length > 0 && <LinkColumn title="Company" links={companyLinks} />}
            {legalLinks.length > 0 && <LinkColumn title="Legal" links={legalLinks} />}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800/40 mt-10 sm:mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">&copy; 2026 Hypertrading. All rights reserved.</p>
          <p className="text-gray-600 text-xs">Built for traders, by traders.</p>
        </div>
      </div>
    </footer>
  );
};
