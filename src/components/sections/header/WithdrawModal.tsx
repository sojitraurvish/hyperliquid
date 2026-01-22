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
      title={
        <div className="flex items-center gap-3 pl-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Coins className="text-white w-4 h-4" />
          </div>
          <span>Withdraw USDC to {chainDisplayName}</span>
        </div>
      }
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick={true}
      closeOnEscape={true}
      showCloseButton={true}
      headerClassName="relative flex items-center justify-between p-4 border-b border-gray-800"
      contentClassName="px-6 pb-6 pt-4"
    >
      <div className="space-y-6 pb-2">
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">
            USDC will be sent over the {chainDisplayName} network to your wallet address.
            Withdrawals should arrive within 5 minutes.
          </p>
          <p className="text-gray-400 text-sm">
            A 1 USDC fee will be deducted from the USDC withdrawn.
          </p>
          <p className="text-gray-400 text-sm">
          </p>
        </div>
        
        {/* {address && (
          <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg space-y-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">Signing Account:</p>
              <p className="text-xs font-mono text-gray-300 break-all">{address}</p>
            </div>
            {connectedAddress && connectedAddress.toLowerCase() !== address.toLowerCase() && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-yellow-400 mb-1">⚠️ Warning: Account Mismatch</p>
                <p className="text-xs text-gray-400 mb-1">Connected Account:</p>
                <p className="text-xs font-mono text-gray-300 break-all">{connectedAddress}</p>
                <p className="text-xs text-yellow-400 mt-2">Your wallet will sign with the account shown above. Make sure this is the correct account.</p>
              </div>
            )}
          </div>
        )} */}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Asset</label>
            <AppDropdown
              variant={VARIANT_TYPES.NOT_SELECTED}
              options={[{ label: "USDC", value: "USDC" }]}
              value={selectedAsset}
              onChange={(value) => setSelectedAsset(value)}
              dropdownClassName="!bg-gray-800 !border !border-gray-700 !text-gray-300 hover:!bg-gray-750 rounded-lg shadow-none"
              optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Withdrawal Chain</label>
            <AppDropdown
              variant={VARIANT_TYPES.NOT_SELECTED}
              options={[{ label: chainDisplayName, value: selectedChain }]}
              value={selectedChain}
              onChange={(value) => setSelectedChain(value)}
              dropdownClassName="!bg-gray-800 !border !border-gray-700 !text-gray-300 hover:!bg-gray-750 rounded-lg shadow-none"
              optionClassName="!bg-gray-800 hover:!bg-gray-700 !text-white !shadow-none"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Amount</label>
            <div className="relative w-full">
              {isLoadingBalance && (
                <div className="absolute inset-0 bg-gray-800 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer" />
                </div>
              )}
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
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
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative z-10"
                disabled={isSubmitting}
              />
              {!isLoadingBalance && withdrawableBalance !== null && (
                <button
                  type="button"
                  onClick={() => {
                    const maxAmount = Math.floor(withdrawableBalance * 100) / 100;
                    setAmount(maxAmount.toFixed(2));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-300 text-sm font-medium cursor-pointer z-20"
                  disabled={isSubmitting || withdrawableBalance === null}
                >
                  MAX: {formattedBalance}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Available: {isLoadingBalance ? (
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : withdrawableBalance !== null ? (
                  `${formattedBalance} USDC`
                ) : (
                  "—"
                )}
              </span>
              <span className="text-gray-500">Minimum: {MIN_WITHDRAWAL_AMOUNT} USDC</span>
            </div>
          </div>

          {status && <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-blue-400 text-sm">{status}</p></div>}
          
          {belowMinimum && amountNum > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">Minimum withdrawal: {MIN_WITHDRAWAL_AMOUNT} USDC</p>
            </div>
          )}
          
          {exceedsBalance && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">Insufficient balance. You have {formattedBalance} USDC available.</p>
            </div>
          )}

          {/* {apiResponse && (
            <div className={`p-3 border rounded-lg ${apiResponse.status === 200 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
              <p className="text-xs font-mono">{`API Response (${apiResponse.status}):`}</p>
              <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-40">{JSON.stringify(apiResponse.body, null, 2)}</pre>
            </div>
          )} */}

          <AppButton 
            type="submit" 
            variant={VARIANT_TYPES.SECONDARY} 
            isDisabled={!canSubmit} 
            isLoading={isSubmitting} 
            className="w-full mt-7 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 text-base font-medium justify-center"
          >
            {isSubmitting ? "Processing..." : `Withdraw to ${chainDisplayName}`}
          </AppButton>
        </form>
      </div>
    </AppModal>
  );
};




