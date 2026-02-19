import React, { useState, useRef } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import AppModal from "@/components/ui/modal";
import AppButton from "@/components/ui/button";
import AppDropdown from "@/components/ui/dropdown";
import { ENVIRONMENT, ENVIRONMENT_TYPES, VARIANT_TYPES } from "@/lib/constants";
import { activeChain } from "@/lib/config/wallet-adapter/wallet-adapter";
import { appToast } from "@/components/ui/toast";
import { Coins } from "lucide-react";

const USDC_DECIMALS = 6;

// Default testnet constants (from Hyperliquid docs)
// USDC deposits happen on Arbitrum Sepolia, which bridges to Hyperliquid testnet
const DEFAULT_CHAIN_ID = activeChain.id // Active chain based on current network preference
const USDC_ADDRESS = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "0x1baAbB04529D43a73232B713C0FE471f7c7334d5" : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`;
const BRIDGE_ADDRESS = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" : "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as `0x${string}`;

// ERC20 ABI for transfer and balanceOf
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [amount, setAmount] = useState(""); // human readable, e.g. "10.5"
  const [status, setStatus] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedChain, setSelectedChain] = useState(
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "arbitrum-sepolia" : "arbitrum"
  );

  // Fetch USDC balance
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: DEFAULT_CHAIN_ID,
    query: {
      enabled: Boolean(address) && chainId === DEFAULT_CHAIN_ID,
    },
  });

  // Format balance for display
  const formattedBalance = balance ? formatUnits(balance, USDC_DECIMALS) : "0";
  // Floor to 2 decimal places to ensure displayed max matches what MAX button sets
  const balanceNum = parseFloat(formattedBalance);
  const flooredBalance = Math.floor(balanceNum * 100) / 100;
  const maxBalance = flooredBalance.toFixed(2);

  // Convert human amount string to token integer (6 decimals)
  let amountArg: bigint | undefined;
  try {
    if (amount && amount.trim() !== "") {
      amountArg = parseUnits(amount, USDC_DECIMALS);

      console.log("amountArg", amountArg);
    } else {
      amountArg = undefined;
    }
  } catch (e) {
    amountArg = undefined;
  }

  // Check if amount meets minimum requirement
  const minAmount = parseUnits("5", USDC_DECIMALS);
  console.log("minAmount", minAmount);
  
  // Check if amount exceeds balance
  const exceedsBalance = balance !== undefined && amountArg !== undefined && amountArg > balance;
  
  // Check if amount is below minimum
  const belowMinimum = amountArg !== undefined && amountArg > BigInt(0) && amountArg < minAmount;
  
  // Allow button to be enabled if amount is valid, meets minimum, and doesn't exceed balance
  const isValidAmount = amountArg !== undefined && amountArg > BigInt(0) && amountArg >= minAmount && !exceedsBalance;
  console.log("isValidAmount", isValidAmount);

  const { writeContractAsync, data: txHash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Track the last processed transaction hash to prevent duplicate toasts
  const processedTxHashRef = useRef<string | undefined>(undefined);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!address) {
      setStatus("Please connect your wallet.");
      appToast.error({ message: "Please connect your wallet." });
      return;
    }

    // Check if we need to switch chains
    if (chainId !== DEFAULT_CHAIN_ID) {
      const chainName = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "Arbitrum Sepolia" : "Arbitrum";
      try {
        setStatus(`Switching to ${chainName} (Chain ID: ${DEFAULT_CHAIN_ID})...`);
        appToast.info({ message: `Switching to ${chainName}...` });
        
        await switchChain({ chainId: DEFAULT_CHAIN_ID });
        
        setStatus("Network switched. Please try the deposit again.");
        appToast.success({ message: "Network switched successfully." });
        return;
      } catch (err) {
        console.error(err);
        setStatus("Failed to switch network. Please switch manually in your wallet.");
        appToast.error({ 
          message: `Please switch to ${chainName} (Chain ID: ${DEFAULT_CHAIN_ID}) in your wallet.` 
        });
        return;
      }
    }

    if (!writeContractAsync) {
      setStatus("Connect wallet and enter a valid amount.");
      appToast.error({ message: "Connect wallet and enter a valid amount." });
      return;
    }

    // Minimum check (5 USDC)
    const min = parseUnits("5", USDC_DECIMALS);
    if (!amountArg || amountArg < min) {
      setStatus("Minimum deposit is 5 USDC.");
      appToast.error({ message: "Minimum deposit is 5 USDC." });
      return;
    }

    // Check if amount exceeds balance
    if (balance && amountArg > balance) {
      setStatus(`Insufficient balance. You have ${maxBalance} USDC available.`);
      appToast.error({ message: `Insufficient balance. You have ${maxBalance} USDC available.` });
      return;
    }

    try {
      setStatus("Sending transaction... (please confirm in wallet)");
      appToast.info({ message: "Sending transaction... (please confirm in wallet)" });

      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [BRIDGE_ADDRESS, amountArg],
        chainId: DEFAULT_CHAIN_ID,
      });
      
      setStatus(`Transaction sent: ${hash}. Waiting for confirmation...`);
      appToast.info({ message: `Transaction sent: ${hash.slice(0, 10)}...` });
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed or rejected.");
      appToast.error({ message: "Transaction failed or rejected." });
    }
  }

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isSuccess && txHash && processedTxHashRef.current !== txHash) {
      processedTxHashRef.current = txHash;
      setStatus(`Deposit successful! Tx: ${txHash}`);
      appToast.success({ message: `Deposit successful! Transaction: ${txHash.slice(0, 10)}...` });
      // Fetch updated balances after successful deposit
      onSuccess?.();
      // Reset form after successful deposit
      setTimeout(() => {
        setAmount("");
        setStatus("");
        onClose();
      }, 2000);
    }
  }, [isSuccess, txHash, onClose, onSuccess]);

  // Reset status if transaction is rejected or fails
  React.useEffect(() => {
    if (writeError && !isPending && !isConfirming) {
      // Transaction was rejected or failed, allow user to try again
      setStatus("Transaction failed or rejected. You can try again.");
    }
  }, [writeError, isPending, isConfirming]);

  // Reset the processed tx hash ref when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      processedTxHashRef.current = undefined;
    }
  }, [isOpen]);

  const handleMaxClick = () => {
    if (balance) {
      // Floor the balance to 2 decimal places to ensure we don't exceed actual balance
      const balanceNum = parseFloat(formattedBalance);
      const floored = Math.floor(balanceNum * 100) / 100;
      const formatted = floored.toFixed(2);
      setAmount(formatted);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input
    if (value === "") {
      setAmount("");
      return;
    }
    
    // Check if the value matches the pattern: optional digits, optional decimal point, and up to 2 decimal digits
    const regex = /^\d*\.?\d{0,2}$/;
    
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  // Dropdown options
  const assetOptions = [
    { label: "USDC", value: "USDC" },
  ];

  const chainOptions = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
    ? [{ label: "Arbitrum Sepolia", value: "arbitrum-sepolia" }]
    : [{ label: "Arbitrum", value: "arbitrum" }];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit USDC"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      showCloseButton={true}
      contentClassName="space-y-5"
    >
        <form onSubmit={handleDeposit} className="space-y-4">
          {/* Asset & Chain Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Asset</span>
              <AppDropdown
                variant={VARIANT_TYPES.NOT_SELECTED}
                options={assetOptions}
                value={selectedAsset}
                onChange={(value) => setSelectedAsset(value)}
                dropdownClassName="!bg-gray-800/60 !border !border-gray-700/50 !text-gray-300 hover:!bg-gray-800 rounded-xl shadow-none"
                optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none !rounded-lg"
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Chain</span>
              <AppDropdown
                variant={VARIANT_TYPES.NOT_SELECTED}
                options={chainOptions}
                value={selectedChain}
                onChange={(value) => setSelectedChain(value)}
                dropdownClassName="!bg-gray-800/60 !border !border-gray-700/50 !text-gray-300 hover:!bg-gray-800 rounded-xl shadow-none"
                optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none !rounded-lg"
                className="w-full"
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Amount (USDC)</span>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-[11px] font-medium text-green-400 hover:text-green-300 cursor-pointer transition-colors"
                disabled={!balance || isPending || isConfirming}
              >
                Max: {maxBalance}
              </button>
            </div>
            <div className="flex items-center bg-gray-800/40 rounded-xl border border-gray-700/50 focus-within:border-green-500/40 transition-colors">
              <input
                type="text"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={handleAmountChange}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                disabled={isPending || isConfirming}
              />
              <span className="pr-4 text-xs font-medium text-gray-500">USDC</span>
            </div>
          </div>

          {/* Status Messages */}
          {status && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-blue-400 text-xs leading-relaxed wrap-break-word">{status}</p>
            </div>
          )}
          {belowMinimum && (
            <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
              <p className="text-red-400 text-xs">Minimum deposit: 5 USDC</p>
            </div>
          )}
          {exceedsBalance && (
            <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
              <p className="text-red-400 text-xs">Insufficient balance. You have {maxBalance} USDC available.</p>
            </div>
          )}

          {/* Deposit Button */}
          <button
            type="submit"
            disabled={!address || !isValidAmount || isPending || isConfirming || isSwitchingChain}
            className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              !address || !isValidAmount || isPending || isConfirming || isSwitchingChain
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400 text-white"
            }`}
          >
            {(isPending || isConfirming || isSwitchingChain) && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSwitchingChain 
              ? "Switching Network..." 
              : isPending 
                ? "Waiting for Wallet..." 
                : isConfirming
                  ? "Confirming..."
                  : chainId !== DEFAULT_CHAIN_ID 
                    ? `Switch to ${ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "Arbitrum Sepolia" : "Arbitrum"}` 
                    : "Deposit"}
          </button>
        </form>
    </AppModal>
  );
};

