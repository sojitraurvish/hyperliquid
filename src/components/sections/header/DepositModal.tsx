import React, { useState, useRef } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import AppModal from "@/components/ui/modal";
import AppButton from "@/components/ui/button";
import AppDropdown from "@/components/ui/dropdown";
import { ENVIRONMENT, ENVIRONMENT_TYPES, VARIANT_TYPES } from "@/lib/constants";
import {chains} from "@/lib/config/wallet-adapter/wallet-adapter";
import { appToast } from "@/components/ui/toast";
import { Coins } from "lucide-react";

const USDC_DECIMALS = 6;

// Default testnet constants (from Hyperliquid docs)
// USDC deposits happen on Arbitrum Sepolia, which bridges to Hyperliquid testnet
const DEFAULT_CHAIN_ID =  chains[0].id // Arbitrum Sepolia chain id (421614)
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
      title={
        <div className="flex items-center gap-3 pl-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Coins className="text-white w-4 h-4" />
          </div>
          <span>Deposit USDC to Hyperliquid</span>
        </div>
      }
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      showCloseButton={true}
      headerClassName="relative flex items-center justify-between p-4 border-b border-gray-800"
      contentClassName="px-6 pb-6 pt-4"
    >
      <div className="space-y-6 pb-2"></div>
        {/* Custom Header with Icon and Title */}
     

        <form onSubmit={handleDeposit} className="space-y-4">
          {/* Asset Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Asset
            </label>
            <AppDropdown
              variant={VARIANT_TYPES.NOT_SELECTED}
              options={assetOptions}
              value={selectedAsset}
              onChange={(value) => setSelectedAsset(value)}
              dropdownClassName="!bg-gray-800 !border !border-gray-700 !text-gray-300 hover:!bg-gray-750 rounded-lg shadow-none"
              optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none"
              className="w-full"
            />
          </div>

          {/* Deposit Chain Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Deposit Chain
            </label>
            <AppDropdown
              variant={VARIANT_TYPES.NOT_SELECTED}
              options={chainOptions}
              value={selectedChain}
              onChange={(value) => setSelectedChain(value)}
              dropdownClassName="!bg-gray-800 !border !border-gray-700 !text-gray-300 hover:!bg-gray-750 rounded-lg shadow-none"
              optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none"
              className="w-full"
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Amount
            </label>
            <div className="relative w-full">
              <input
                type="text"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                disabled={isPending || isConfirming}
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-300 text-sm font-medium cursor-pointer"
                disabled={!balance || isPending || isConfirming}
              >
                MAX: {maxBalance}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {status && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm wrap-break-word whitespace-pre-wrap">{status}</p>
            </div>
          )}
          {belowMinimum && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs wrap-break-word whitespace-pre-wrap">Minimum deposit: 5 USDC</p>
            </div>  
          )}
          {exceedsBalance && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm wrap-break-word whitespace-pre-wrap">Insufficient balance. You have {maxBalance} USDC available.</p>
            </div>
          )}

          {/* Deposit Button */}
          <AppButton
            type="submit"
            variant={VARIANT_TYPES.SECONDARY}
            isDisabled={
              !address || 
              !isValidAmount || 
              isPending || 
              isConfirming || 
              isSwitchingChain
            }
            isLoading={isPending || isConfirming || isSwitchingChain}
            className="w-full mt-7 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 text-base font-medium justify-center"
          >
            {isSwitchingChain 
              ? "Switching Network..." 
              : isPending 
                ? "Waiting for MetaMask..." 
                : isConfirming
                  ? "Confirming Transaction..."
                  : chainId !== DEFAULT_CHAIN_ID 
                    ? `Switch to ${ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "Arbitrum Sepolia" : "Arbitrum"} (${DEFAULT_CHAIN_ID})` 
                    : "Deposit"}
          </AppButton>
        </form>

    </AppModal>
  );
};

