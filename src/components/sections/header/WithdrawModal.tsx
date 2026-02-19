import React, { useEffect, useState, useCallback } from "react";
import { useAccount, useSignTypedData, useWalletClient, useChainId } from "wagmi";
import { getAddress, recoverTypedDataAddress } from "viem";
import AppModal from "@/components/ui/modal";
import AppButton from "@/components/ui/button";
import AppDropdown from "@/components/ui/dropdown";
import { ENVIRONMENT, ENVIRONMENT_TYPES, VARIANT_TYPES } from "@/lib/constants";
import { appToast } from "@/components/ui/toast";
import { Coins } from "lucide-react";
import { infoClient } from "@/lib/config/hyperliquied/hyperliquid-client";
import { HYPERLIQUID_API_URL } from "@/lib/config";

type WithdrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

// Helper function to split hex signature into r, s, v components
function splitSignature(sigHex: `0x${string}` | string) {
  if (!sigHex || typeof sigHex !== "string") throw new Error("Invalid signature");
  
  const s = sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex;
  
  if (s.length !== 130 && s.length !== 132) {
    // 65 bytes = 130 hex chars; sometimes v is 1 byte appended -> 132 (with 0x)
    // We'll still try to parse if length matches 130.
  }
  
  const r = `0x${s.slice(0, 64)}` as `0x${string}`;
  const sPart = `0x${s.slice(64, 128)}` as `0x${string}`;
  let vHex = s.slice(128, 130);
  
  if (!vHex) {
    // fallback: last byte might be appended differently; try last 2 chars
    vHex = s.slice(-2);
  }
  
  let v = parseInt(vHex, 16);
  
  // Some signers return 0/1; convert to 27/28 if necessary
  if (v === 0 || v === 1) v += 27;
  
  // Ensure v is 27 or 28 else keep original
  return { r, s: sPart, v };
}

// network config - uses environment-based API URL
// Note: Both mainnet and testnet use the same API URL based on environment
// The actual network is determined by the chain ID used for signing
const NETWORK_CONFIG = {
  42161: {
    api: HYPERLIQUID_API_URL,
    hyperliquidChainString: "Mainnet",
    permitChainId: 42161,
    signatureChainIdHex: "0xa4b1",
  },
  421614: {
    api: HYPERLIQUID_API_URL,
    hyperliquidChainString: "Testnet",
    permitChainId: 421614,
    signatureChainIdHex: "0x66eee",
  },
};

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { address: rawAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Normalize address to checksummed format for consistency
  const connectedAddress = rawAddress ? getAddress(rawAddress) : undefined;
  console.log("connectedAddress", connectedAddress);
  
  // Use the wallet client's account address if available (this is what actually signs)
  // Otherwise fall back to connected address
  const signingAddress = walletClient?.account 
    ? getAddress(walletClient.account.address) 
    : connectedAddress;
  console.log("signingAddress", signingAddress);
  // Use signing address for balance checks and operations
  const address = signingAddress;

  const targetChainId = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? 421614 : 42161;
  const cfg = NETWORK_CONFIG[targetChainId];
  const chainDisplayName = ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "Arbitrum Sepolia" : "Arbitrum";

  const [amount, setAmount] = useState("");
  const [withdrawableBalance, setWithdrawableBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [apiResponse, setApiResponse] = useState<{ status: number; body: unknown } | null>(null);
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedChain, setSelectedChain] = useState(
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? "arbitrum-sepolia" : "arbitrum"
  );

  // Minimum withdrawal amount (2 USDC)
  const MIN_WITHDRAWAL_AMOUNT = 2;

  useEffect(() => {
    if (!address || !isOpen) return;
    let mounted = true;
    (async () => {
      setIsLoadingBalance(true);
      try {
        const resp = await infoClient.webData2({ user: address });
        const withdrawable = resp?.clearinghouseState?.withdrawable;
        const num = typeof withdrawable === "number" ? withdrawable : typeof withdrawable === "string" ? parseFloat(withdrawable) : null;
        if (mounted) setWithdrawableBalance(num);
      } catch (e) {
        console.error("webData2 error:", e);
        if (mounted) setWithdrawableBalance(null);
      } finally {
        if (mounted) setIsLoadingBalance(false);
      }
    })();
    return () => { mounted = false; };
  }, [address, isOpen]);

  // Show warning if addresses don't match
  useEffect(() => {
    if (connectedAddress && signingAddress && connectedAddress.toLowerCase() !== signingAddress.toLowerCase()) {
      console.warn("Address mismatch detected:", {
        connected: connectedAddress,
        signing: signingAddress,
      });
    }
  }, [connectedAddress, signingAddress]);

  const amountNum = amount && amount.trim() !== "" ? parseFloat(amount) : 0;
  
  // Validation checks
  const exceedsBalance = withdrawableBalance !== null && amountNum > withdrawableBalance;
  const belowMinimum = amountNum > 0 && amountNum < MIN_WITHDRAWAL_AMOUNT;
  const isValidAmount = amountNum >= MIN_WITHDRAWAL_AMOUNT && !exceedsBalance;
  const hasBalance = withdrawableBalance !== null && withdrawableBalance > 0;
  
  const canSubmit = isConnected && address && isValidAmount && !isSubmitting && hasBalance;
  
  // Format balance for display
  const formattedBalance = withdrawableBalance !== null ? withdrawableBalance.toFixed(2) : "0.00";

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setApiResponse(null);

    if (!isConnected || !address) {
      appToast.error({ message: "Please connect your wallet first." });
      return;
    }

    // Final check: verify we have a wallet client account
    if (!walletClient?.account) {
      appToast.error({ message: "Wallet client not available. Please reconnect your wallet." });
      return;
    }

    // Use the wallet client's account address (this is what will actually sign)
    const actualSigningAddress = getAddress(walletClient.account.address);
    
    // Warn if there's a mismatch
    if (actualSigningAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn("Using wallet client account instead of connected account:", {
        connected: address,
        signing: actualSigningAddress,
      });
      // Update address to the actual signing address
      // Note: We'll use actualSigningAddress for the destination
    }
    if (!amount || Number(amount) <= 0) {
      appToast.error({ message: "Enter a valid amount." });
      return;
    }
    
    // Minimum withdrawal check
    if (Number(amount) < MIN_WITHDRAWAL_AMOUNT) {
      appToast.error({ message: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} USDC.` });
      return;
    }
    
    // Balance check
    if (withdrawableBalance !== null && Number(amount) > withdrawableBalance) {
      appToast.error({ message: `Requested amount exceeds withdrawable balance. Available: ${formattedBalance} USDC` });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use milliseconds everywhere. DO NOT use BigInt here — use Number.
      const timeMs = Date.now(); // example: 1700000000000
      const nonce = timeMs;

      // signatureChainId is the chain id for EIP-712 domain (hex string like "0xa4b1")
      const signatureChainIdHex = "0x" + chainId.toString(16);

      // EIP-712 domain + types according to Hyperliquid docs
      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: chainId, // numeric chain id (wagmi expects numeric chainId here)
        verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      };

      const types = {
        // Primary type used by Hyperliquid for withdraw actions
        "HyperliquidTransaction:Withdraw": [
          { name: "hyperliquidChain", type: "string" },
          { name: "destination", type: "string" },
          { name: "amount", type: "string" }, // amount as USD string
          { name: "time", type: "uint64" }, // timestamp ms
        ],
      };

      // Use the wallet client's account address for destination (the account that's actually signing)
      const actualSigningAddress = walletClient?.account 
        ? getAddress(walletClient.account.address) 
        : address;
      
      // Use lowercase address for Hyperliquid API
      const destinationAddress = actualSigningAddress.toLowerCase();

      const message = {
        hyperliquidChain: cfg.hyperliquidChainString, // "Mainnet" or "Testnet"
        destination: destinationAddress,
        amount: amount.toString(),
        time: timeMs,
      };
      
      console.log("Withdrawal message details:", {
        connectedAddress: address,
        signingAddress: actualSigningAddress,
        destinationAddress: destinationAddress,
        message,
        domain,
        types,
      });

      setStatus("Requesting wallet signature (EIP-712)...");
      appToast.info({ message: "Please sign the withdrawal request..." });

      // Sign typed data
      // wagmi's signTypedDataAsync expects { domain, types, primaryType?, message }
      // primaryType is the name of the struct, here "HyperliquidTransaction:Withdraw"
      let signature: `0x${string}`;
      try {
        signature = await signTypedDataAsync({ 
          domain, 
          types, 
          primaryType: "HyperliquidTransaction:Withdraw",
          message 
        });
      } catch (err: any) {
        const name = err?.name || "";
        const code = err?.code;
        const msg = err?.message || "";
        const isUserReject = name === "UserRejectedRequestError" || code === 4001 || String(msg).toLowerCase().includes("user rejected");
        if (isUserReject) {
          appToast.error({ message: "Signature request was rejected." });
          setStatus("");
          setIsSubmitting(false);
          return;
        }
        throw err;
      }

      setStatus("Signature received, preparing POST to Hyperliquid API...");

      // Verify the signature was created by the expected signing account
      let recoveredAddress: `0x${string}`;
      try {
        recoveredAddress = await recoverTypedDataAddress({
          domain,
          types,
          primaryType: "HyperliquidTransaction:Withdraw",
          message,
          signature,
        });
        console.log("Signature verification:", {
          expectedSigningAddress: address,
          recoveredAddress: recoveredAddress,
          connectedAddress: connectedAddress,
          match: recoveredAddress.toLowerCase() === address.toLowerCase(),
        });
        
        // Get the actual signing address from wallet client
        const actualSigningAddress = walletClient?.account 
          ? getAddress(walletClient.account.address) 
          : address;
        
        // Check if recovered address matches the actual signing address
        if (recoveredAddress.toLowerCase() !== actualSigningAddress.toLowerCase()) {
          const errorMsg = `Signature mismatch! Expected: ${actualSigningAddress.slice(0, 6)}...${actualSigningAddress.slice(-4)}, but signature is from: ${recoveredAddress.slice(0, 6)}...${recoveredAddress.slice(-4)}. Please switch to the correct account in your wallet.`;
          appToast.error({ message: errorMsg });
          setStatus(`Signature address mismatch. Expected: ${actualSigningAddress}, Got: ${recoveredAddress}. Please switch accounts in your wallet.`);
          setIsSubmitting(false);
          return;
        }
        
        // Also check if it matches the connected address (for user info)
        if (recoveredAddress.toLowerCase() !== address.toLowerCase() && address) {
          console.warn("Signing account differs from connected account:", {
            connected: address,
            signing: recoveredAddress,
          });
        }
      } catch (recoverErr) {
        console.error("Failed to recover address from signature:", recoverErr);
        // Continue anyway, but log the error
      }
console.log("signature", signature);
      // split into r, s, v without ethers
      const { r, s, v } = splitSignature(signature);
      console.log("r, s, v", r, s, v);
      // Construct action and top-level body per Hyperliquid /exchange spec
      const action = {
        type: "withdraw3",
        signatureChainId: signatureChainIdHex, // hex string like "0xa4b1"
        hyperliquidChain: cfg.hyperliquidChainString, // "Mainnet" or "Testnet"
        destination: destinationAddress,
        amount: amount.toString(),
        time: timeMs,
      };

      const body = {
        action,
        nonce: nonce,
        signature: { r, s, v },
      };

      console.log("Withdrawal request:", {
        connectedAddress: address,
        destinationAddress: destinationAddress,
        amount: amount.toString(),
        body
      });

      // Send to Hyperliquid API
      setStatus("Submitting withdrawal request to Hyperliquid...");
      appToast.info({ message: "Submitting withdrawal request..." });

      const res = await fetch(cfg.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json().catch(() => null);
      setApiResponse({ status: res.status, body: data });

      // Handle responses
      if (!res.ok) {
        setStatus(`API error: ${res.status} ${res.statusText} ${data ? JSON.stringify(data) : ""}`);
        appToast.error({ message: `API error: ${res.status} ${res.statusText}` });
        setIsSubmitting(false);
        return;
      }

      // Hyperliquid replies with { status: "ok", response: ... } or { status: "err", response: "msg" }
      if (data && data.status === "ok") {
        const successMsg = "Withdraw request submitted — check Hyperliquid UI for status (arrives in a few minutes).";
        appToast.success({ message: successMsg });
        setStatus(successMsg);

        // Fetch updated balances after successful withdrawal
        onSuccess?.();

        // Clear amount and close modal after successful withdrawal
        setAmount("");
        setTimeout(() => {
          setStatus("");
          setApiResponse(null);
          onClose();
        }, 2000);
        setIsSubmitting(false);
        return;
      } else if (data && data.status === "err") {
        // If server says nonce too low, that indicates you used seconds or a nonce older than last used.
        if (data.response && typeof data.response === "string" && data.response.toLowerCase().includes("nonce")) {
          appToast.error({ message: `Withdrawal failed: ${data.response}` });
          setStatus(`Withdrawal failed: ${data.response}`);
          // Helpful hint for debugging:
          console.warn("Nonce error. Ensure you use milliseconds (Date.now()) and that your nonce is larger than any previous nonce for this signer.");
          setIsSubmitting(false);
          return;
        }

        const errMsg = data.response || data.error || data.message || "Unknown error";
        setStatus(`Hyperliquid returned error: ${errMsg}`);
        
        // Check if error mentions an address that differs from connected address
        const errorStr = String(errMsg);
        const addressMatch = errorStr.match(/0x[a-fA-F0-9]{40}/i);
        if (addressMatch && address) {
          const errorAddress = addressMatch[0];
          const normalizedErrorAddress = getAddress(errorAddress);
          if (normalizedErrorAddress.toLowerCase() !== address.toLowerCase()) {
            console.error("Address mismatch detected:", {
              connected: address,
              errorAddress: normalizedErrorAddress,
              errorMessage: errMsg
            });
            appToast.error({ 
              message: `Address mismatch: Connected wallet (${address.slice(0, 6)}...${address.slice(-4)}) differs from error address. Please check your wallet connection.` 
            });
            setStatus(`Address mismatch detected. Connected: ${address}, Error mentions: ${normalizedErrorAddress}. ${errMsg}`);
            setIsSubmitting(false);
            return;
          }
        }
        
        appToast.error({ message: `Withdrawal failed: ${errorStr}` });
        setIsSubmitting(false);
        return;
      } else {
        // Unexpected response format
        setStatus(`Submitted. Response: ${JSON.stringify(data)}`);
        appToast.info({ message: "Withdrawal submitted. Check status in Hyperliquid UI." });
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      const name = err?.name || "";
      const code = err?.code;
      const msg = err?.message || err?.shortMessage || "Withdraw failed";
      const isUserReject = name === "UserRejectedRequestError" || code === 4001 || String(msg).toLowerCase().includes("user rejected");
      if (isUserReject) {
        appToast.error({ message: "Signature request was rejected." });
        setStatus("");
      } else {
        appToast.error({ message: String(msg) });
        setStatus(String(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw USDC"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      showCloseButton={true}
      contentClassName="space-y-5"
    >
        <div className="flex items-start gap-2.5 p-3 bg-gray-800/30 border border-gray-800/50 rounded-xl">
          <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-xs text-gray-400 leading-relaxed">
            <p>USDC sent via {chainDisplayName}. Arrives within ~5 minutes.</p>
            <p className="text-gray-500 mt-0.5">A 1 USDC fee is deducted from the withdrawal.</p>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Asset & Chain Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Asset</span>
              <AppDropdown
                variant={VARIANT_TYPES.NOT_SELECTED}
                options={[{ label: "USDC", value: "USDC" }]}
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
                options={[{ label: chainDisplayName, value: selectedChain }]}
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
              {!isLoadingBalance && withdrawableBalance !== null && (
                <button
                  type="button"
                  onClick={() => {
                    const maxAmount = Math.floor(withdrawableBalance * 100) / 100;
                    setAmount(maxAmount.toFixed(2));
                  }}
                  className="text-[11px] font-medium text-green-400 hover:text-green-300 cursor-pointer transition-colors"
                  disabled={isSubmitting || withdrawableBalance === null}
                >
                  Max: {formattedBalance}
                </button>
              )}
            </div>
            <div className="relative">
              {isLoadingBalance && (
                <div className="absolute inset-0 bg-gray-800/40 rounded-xl overflow-hidden z-10">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />
                </div>
              )}
              <div className="flex items-center bg-gray-800/40 rounded-xl border border-gray-700/50 focus-within:border-green-500/40 transition-colors">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") { setAmount(""); return; }
                    const regex = /^\d*\.?\d{0,2}$/;
                    if (regex.test(value)) setAmount(value);
                  }}
                  placeholder="0.00"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative z-10"
                  disabled={isSubmitting}
                />
                <span className="pr-4 text-xs font-medium text-gray-500 relative z-10">USDC</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">
                Available: {isLoadingBalance ? (
                  <span className="inline-flex items-center gap-1">
                    <div className="w-2.5 h-2.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : withdrawableBalance !== null ? (
                  `${formattedBalance} USDC`
                ) : (
                  "—"
                )}
              </span>
              <span className="text-gray-600">Min: {MIN_WITHDRAWAL_AMOUNT} USDC</span>
            </div>
          </div>

          {status && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
              <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-blue-400 text-xs leading-relaxed wrap-break-word">{status}</p>
            </div>
          )}
          
          {belowMinimum && amountNum > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
              <p className="text-red-400 text-xs">Minimum withdrawal: {MIN_WITHDRAWAL_AMOUNT} USDC</p>
            </div>
          )}
          
          {exceedsBalance && (
            <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
              <p className="text-red-400 text-xs">Insufficient balance. You have {formattedBalance} USDC available.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              !canSubmit
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400 text-white"
            }`}
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isSubmitting ? "Processing..." : `Withdraw to ${chainDisplayName}`}
          </button>
        </form>
    </AppModal>
  );
};




