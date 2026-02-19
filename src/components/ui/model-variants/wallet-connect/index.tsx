import React, { useState } from "react";
import { AppModal } from "@/components/ui/modal/index";
import { VARIANT_TYPES } from "@/lib/constants";
import { Wallet, Backpack, Link, Zap, CircleDollarSign, Mail } from "lucide-react";

const walletOptions = [
  { name: "MetaMask", icon: Wallet, color: "#F6851B" },
  { name: "Backpack", icon: Backpack, color: "#E84142" },
  { name: "WalletConnect", icon: Link, color: "#3B99FC" },
  { name: "OKX Wallet", icon: Zap, color: "#9CA3AF" },
  { name: "Coinbase Wallet", icon: CircleDollarSign, color: "#0052FF" },
];

export const ModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
      >
        Connect Wallet
      </button>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect Wallet"
        variant={VARIANT_TYPES.PRIMARY}
        closeOnOutsideClick={true}
        closeOnEscape={true}
        showCloseButton={true}
      >
        <div className="space-y-2">
          {walletOptions.map((wallet, index) => {
            const IconComponent = wallet.icon;
            return (
              <button
                key={index}
                onClick={() => console.log(`Selected: ${wallet.name}`)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800/50 hover:border-gray-700/60 rounded-xl transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${wallet.color}15` }}>
                  <IconComponent className="w-5 h-5" color={wallet.color} />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{wallet.name}</span>
              </button>
            );
          })}
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-gray-900 text-gray-500 uppercase tracking-wider">or</span>
          </div>
        </div>

        <button
          onClick={() => console.log("Email login selected")}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800/50 hover:border-gray-700/60 rounded-xl transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-700/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Log in with Email</span>
        </button>
      </AppModal>
    </div>
  );
};

export default ModalExample;
