"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// ==================== Types ====================

type TabValue = "balances" | "positions" | "openorders" | "twap" | "tradehistory" | "fundinghistory" | "orderhistory";

interface Tab {
  label: string;
  value: TabValue;
  count?: number;
}

// ==================== Modular UI Components ====================

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "primary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = ({ 
  variant = "ghost", 
  size = "md", 
  children, 
  className = "",
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    ghost: "bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300",
    outline: "border border-gray-700 bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 hover:border-gray-600",
    primary: "bg-teal-400 text-white hover:bg-teal-500",
  };
  
  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-xs sm:text-sm",
    lg: "h-9 px-4 text-sm",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Tab Button Component
interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

const TabButton = ({ isActive, onClick, children, count }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-2 sm:px-3 h-8 sm:h-10 text-xs font-medium transition-all duration-200
        whitespace-nowrap
        ${isActive 
          ? "text-white border-b-2 border-teal-400" 
          : "text-gray-400 hover:text-gray-300 border-b-2 border-transparent"
        }
      `}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-gray-500">({count})</span>
      )}
    </button>
  );
};

// Tab Content Component
interface TabContentProps {
  value: TabValue;
  activeTab: TabValue;
  children: React.ReactNode;
}

const TabContent = ({ value, activeTab, children }: TabContentProps) => {
  if (value !== activeTab) return null;
  
  return (
    <div className="flex-1 overflow-auto">
      {children}
    </div>
  );
};

// Positions Table Header Component
const PositionsTableHeader = () => {
  const headers = [
    { label: "Coin", className: "col-span-2 sm:col-span-1" },
    { label: "Size", className: "col-span-2 sm:col-span-1" },
    { label: "Position Value", icon: true, className: "col-span-2 sm:col-span-1" },
    { label: "Entry Price", className: "hidden sm:col-span-1 sm:block" },
    { label: "Mark Price", className: "hidden md:col-span-1 md:block" },
    { label: "PNL (ROE %)", underline: true, className: "col-span-2 sm:col-span-1" },
    { label: "Liq. Price", className: "hidden lg:col-span-1 lg:block" },
    { label: "Margin", underline: true, className: "hidden xl:col-span-1 xl:block" },
    { label: "Funding", underline: true, className: "hidden xl:col-span-1 xl:block" },
  ];

  return (
    <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-11 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div
          key={index}
          className={`flex items-center gap-1 ${header.className} ${
            header.underline ? "underline decoration-dotted" : ""
          }`}
        >
          <span>{header.label}</span>
          {header.icon && <ChevronDown className="h-3 w-3 shrink-0" />}
        </div>
      ))}
    </div>
  );
};

// Balances Table Header Component
const BalancesTableHeader = () => {
  const headers = [
    { label: "Coin", className: "col-span-2 sm:col-span-1" },
    { label: "Total Balance", className: "col-span-2 sm:col-span-1" },
    { label: "Available Balance", className: "col-span-2 sm:col-span-1" },
    { label: "USDC Value", icon: true, className: "hidden md:col-span-1 md:block" },
    { label: "PNL (ROE %)", underline: true, className: "hidden lg:col-span-1 lg:block" },
    { label: "Send", className: "col-span-1 sm:col-span-1" },
    { label: "Transfer", className: "col-span-1 sm:col-span-1" },
  ];

  return (
    <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div
          key={index}
          className={`flex items-center gap-1 ${header.className} ${
            header.underline ? "underline decoration-dotted" : ""
          }`}
        >
          <span>{header.label}</span>
          {header.icon && <ChevronDown className="h-3 w-3 shrink-0" />}
        </div>
      ))}
    </div>
  );
};

// Orders Table Header Component
const OrdersTableHeader = () => {
  const headers = [
    { label: "Time", className: "col-span-2 sm:col-span-1" },
    { label: "Pair", className: "col-span-2 sm:col-span-1" },
    { label: "Type", className: "col-span-2 sm:col-span-1" },
    { label: "Side", className: "hidden sm:col-span-1 sm:block" },
    { label: "Price", className: "hidden md:col-span-1 md:block" },
    { label: "Amount", className: "hidden lg:col-span-1 lg:block" },
    { label: "Filled", className: "hidden xl:col-span-1 xl:block" },
    { label: "Status", className: "hidden xl:col-span-1 xl:block" },
    { label: "Actions", className: "col-span-2 sm:col-span-1" },
  ];

  return (
    <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-10 gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs text-gray-400 border-b border-gray-800">
      {headers.map((header, index) => (
        <div key={index} className={header.className}>
          {header.label}
        </div>
      ))}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center px-2 sm:px-3 py-6 sm:py-8 min-h-[100px]">
      <p className="text-xs sm:text-sm text-gray-400 text-center">{message}</p>
    </div>
  );
};

// Online Indicator Component
const OnlineIndicator = () => {
  return (
    <div className="absolute bottom-2 left-2 sm:left-3 z-10">
      <div className="flex items-center gap-1.5 text-xs">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-gray-400 hidden sm:inline">Online</span>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

export const BottomPanel = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("positions");

  const tabs: Tab[] = [
    { label: "Balances", value: "balances", count: 1 },
    { label: "Positions", value: "positions" },
    { label: "Open Orders", value: "openorders" },
    { label: "TWAP", value: "twap" },
    { label: "Trade History", value: "tradehistory" },
    { label: "Funding History", value: "fundinghistory" },
    { label: "Order History", value: "orderhistory" },
  ];

  return (
    <div className="relative h-full bg-gray-950 border-t border-gray-800 flex flex-col min-h-0">
      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 px-2 sm:px-3 shrink-0">
        {/* Tabs List - Scrollable on mobile */}
        <div className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-0 min-w-max">
            {tabs.map((tab) => (
              <TabButton
                key={tab.value}
                isActive={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                count={tab.count}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>

        {/* Filter Button */}
        <div className="shrink-0 ml-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-gray-400 hover:text-gray-300 gap-1"
          >
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Positions Tab */}
        <TabContent value="positions" activeTab={activeTab}>
          <PositionsTableHeader />
          <EmptyState message="No open positions yet" />
        </TabContent>

        {/* Balances Tab */}
        <TabContent value="balances" activeTab={activeTab}>
          <BalancesTableHeader />
          <EmptyState message="Connect wallet to view balances" />
        </TabContent>

        {/* Open Orders Tab */}
        <TabContent value="openorders" activeTab={activeTab}>
          <OrdersTableHeader />
          <EmptyState message="No open orders" />
        </TabContent>

        {/* TWAP Tab */}
        <TabContent value="twap" activeTab={activeTab}>
          <EmptyState message="No TWAP orders" />
        </TabContent>

        {/* Trade History Tab */}
        <TabContent value="tradehistory" activeTab={activeTab}>
          <EmptyState message="No trade history" />
        </TabContent>

        {/* Funding History Tab */}
        <TabContent value="fundinghistory" activeTab={activeTab}>
          <EmptyState message="No funding history" />
        </TabContent>

        {/* Order History Tab */}
        <TabContent value="orderhistory" activeTab={activeTab}>
          <EmptyState message="No order history" />
        </TabContent>
      </div>

      {/* Online Indicator */}
      <OnlineIndicator />
    </div>
  );
};
