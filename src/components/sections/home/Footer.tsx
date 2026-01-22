import Link from 'next/link';
import { Twitter, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { ROUTES, EXTERNAL_URLS } from '@/lib/config';

// Define which pages actually exist
const existingPages = new Set([
  ROUTES.HOME,
  ROUTES.TRADE,
  ROUTES.MARKETS,
  ROUTES.PORTFOLIO,
  ROUTES.BLOG,
  ROUTES.FAQ,
  ROUTES.SUPPORT,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
]);

export const Footer = () => {
  // Platform Links - only show existing pages
  const platformLinks = [
    { label: 'Trade', href: ROUTES.TRADE },
    { label: 'Markets', href: ROUTES.MARKETS },
    { label: 'Portfolio', href: ROUTES.PORTFOLIO },
  ].filter((link) => existingPages.has(link.href));

  // Resources Links - only show existing pages
  const resourcesLinks = [
    { label: 'Blog', href: ROUTES.BLOG },
    { label: 'FAQ', href: ROUTES.FAQ },
    { label: 'Support', href: ROUTES.SUPPORT },
  ].filter((link) => existingPages.has(link.href));

  // Company Links - only show existing pages (using Support for Contact)
  const companyLinks = [
    { label: 'Contact', href: ROUTES.SUPPORT }, // Use Support page for Contact
  ].filter((link) => existingPages.has(link.href));

  // Legal Links - only show existing pages
  const legalLinks = [
    { label: 'Terms of Service', href: ROUTES.TERMS },
    { label: 'Privacy Policy', href: ROUTES.PRIVACY },
  ].filter((link) => existingPages.has(link.href));

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, href: EXTERNAL_URLS.TWITTER },
    { icon: <MessageCircle className="w-5 h-5" />, href: EXTERNAL_URLS.DISCORD },
    { icon: <Mail className="w-5 h-5" />, href: EXTERNAL_URLS.SUPPORT_EMAIL },
    { icon: <ExternalLink className="w-5 h-5" />, href: EXTERNAL_URLS.GITHUB },
  ];

  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="font-semibold text-xl text-white">Hypertrading</span>
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md">
              The most advanced decentralized perpetual exchange. Trade with up to 50x leverage on any asset.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {resourcesLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 Hypertrading. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Built for traders, by traders.
          </p>
        </div>
      </div>
    </footer>
  );
};

