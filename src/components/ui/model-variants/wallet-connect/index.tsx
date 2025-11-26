import React, { useState } from "react";
import { AppModal } from "@/components/ui/modal/index";
import { AppButton } from "../../button";
import { VARIANT_TYPES } from "@/lib/constants";
import { Wallet, Backpack, Link, Zap, CircleDollarSign, Mail } from "lucide-react";

// Example wallet options similar to the image
const walletOptions = [
  { name: "MetaMask", icon: Wallet, color: "#F6851B" },
  { name: "Backpack", icon: Backpack, color: "#E84142" },
  { name: "WalletConnect", icon: Link, color: "#3B99FC" },
  { name: "OKX Wallet", icon: Zap, color: "#9CA3AF" },
  { name: "Coinbase Wallet", icon: CircleDollarSign, color: "#0052FF" },
];

export const ModalExample: React.FC = (
  
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      {/* Button to trigger modal */}
      <AppButton
        variant={VARIANT_TYPES.SECONDARY}
        onClick={() => setIsModalOpen(true)}
      >
        Open Connect Modal
      </AppButton>

      {/* Modal Component */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect"
        variant={VARIANT_TYPES.PRIMARY}
        closeOnOutsideClick={true}
        closeOnEscape={true}
        showCloseButton={true}
      >
        <div className="space-y-3">
          {walletOptions.map((wallet, index) => {
            const IconComponent = wallet.icon;
            return (
              <AppButton
                key={index}
                variant={VARIANT_TYPES.SECONDARY}
                onClick={() => {
                  console.log(`Selected: ${wallet.name}`);
                  // Handle wallet connection logic here
                }}  
              >
                <IconComponent className="w-5 h-5" color={wallet.color} />
                <span className="font-medium">{wallet.name}</span>
              </AppButton>
            );
          })}
        </div>

        {/* OR Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">OR</span>
          </div>
        </div>

        {/* Email Login Option */}
        <AppButton
          variant={VARIANT_TYPES.SECONDARY}
          onClick={() => {
            console.log("Email login selected");
            // Handle email login logic here
          }}
        >
          <Mail className="w-5 h-5" color="#9CA3AF" />
          <span className="font-medium">Log in with Email</span>
        </AppButton>
      </AppModal>
    </div>
  );
};

export default ModalExample;

