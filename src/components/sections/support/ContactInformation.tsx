"use client";

import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";

export const ContactInformation = () => {
  return (
    <div className="space-y-8">
      {/* Contact Information Section */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Contact Information
        </h2>

        <div className="space-y-6">
          {/* Email */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Email</h3>
            </div>
            <div className="ml-8 space-y-1">
              <a
                href="mailto:hello@hypertrading.io"
                className="block text-gray-400 hover:text-green-400 transition-colors"
              >
                hello@hypertrading.io
              </a>
              <a
                href="mailto:support@hypertrading.io"
                className="block text-gray-400 hover:text-green-400 transition-colors"
              >
                support@hypertrading.io
              </a>
            </div>
          </div>

          {/* Discord */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Discord</h3>
            </div>
            <div className="ml-8">
              <a
                href="https://discord.gg/hypertrading"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                discord.gg/hypertrading
              </a>
            </div>
          </div>

          {/* Support Hours */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Support Hours</h3>
            </div>
            <div className="ml-8">
              <p className="text-gray-400">24/7 - We're always here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Offices Section */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Our Offices
        </h2>

        <div className="space-y-4">
          {/* Singapore */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-400">
                <span className="font-semibold text-white">Singapore:</span> 1 Raffles Place, Tower 2, Singapore 048616
              </p>
            </div>
          </div>

          {/* London */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-400">
                <span className="font-semibold text-white">London:</span> 1 Canada Square, Canary Wharf, London E14 5AB
              </p>
            </div>
          </div>

          {/* Miami */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-400">
                <span className="font-semibold text-white">Miami:</span> 1111 Brickell Ave, Suite 2700, Miami, FL 33131
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

