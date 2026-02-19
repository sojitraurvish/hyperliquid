"use client";

import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";

export const ContactInformation = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
          Contact Information
        </h2>

        <div className="space-y-5">
          <div className="group p-4 rounded-2xl bg-gray-900/30 border border-gray-800/40 hover:border-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Mail className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Email</h3>
            </div>
            <div className="pl-0 sm:pl-11 space-y-1">
              <a href="mailto:hello@hypertrading.io" className="block text-gray-400 hover:text-green-400 transition-colors text-sm">
                hello@hypertrading.io
              </a>
              <a href="mailto:support@hypertrading.io" className="block text-gray-400 hover:text-green-400 transition-colors text-sm">
                support@hypertrading.io
              </a>
            </div>
          </div>

          <div className="group p-4 rounded-2xl bg-gray-900/30 border border-gray-800/40 hover:border-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Discord</h3>
            </div>
            <div className="pl-0 sm:pl-11">
              <a href="https://discord.gg/hypertrading" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                discord.gg/hypertrading
              </a>
            </div>
          </div>

          <div className="group p-4 rounded-2xl bg-gray-900/30 border border-gray-800/40 hover:border-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Clock className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Support Hours</h3>
            </div>
            <div className="pl-0 sm:pl-11">
              <p className="text-gray-400 text-sm">24/7 - We're always here</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
          Our Offices
        </h2>

        <div className="space-y-3">
          {[
            { city: "Singapore", address: "1 Raffles Place, Tower 2, Singapore 048616" },
            { city: "London", address: "1 Canada Square, Canary Wharf, London E14 5AB" },
            { city: "Miami", address: "1111 Brickell Ave, Suite 2700, Miami, FL 33131" },
          ].map((office) => (
            <div key={office.city} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-900/30 border border-gray-800/40">
              <div className="p-2 bg-green-500/10 rounded-xl shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-gray-400 text-sm">
                <span className="font-semibold text-white">{office.city}:</span> {office.address}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
