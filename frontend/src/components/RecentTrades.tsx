"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatTimeAgo } from "@/utils/formatters";

interface RecentTradeProps {
  tokenAsset: string;
  paymentAsset: string;
}

interface Trade {
  id: string;
  price: number;
  amount: number;
  total: number;
  type: "buy" | "sell";
  timestamp: number;
}

export default function RecentTrades({
  tokenAsset,
  paymentAsset,
}: RecentTradeProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent trades data
  useEffect(() => {
    const loadRecentTrades = async () => {
      try {
        setIsLoading(true);

        // In a real implementation, this would fetch actual trade history from the blockchain
        // For now, we'll generate mock data
        generateMockTrades();
      } catch (error) {
        console.error("Error loading recent trades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentTrades();

    // Set up polling to refresh trade data
    const interval = setInterval(loadRecentTrades, 15000);
    return () => clearInterval(interval);
  }, [tokenAsset, paymentAsset]);

  // Generate mock trade data for demonstration
  const generateMockTrades = () => {
    const mockTrades: Trade[] = [];
    const now = Date.now();

    // Generate 20 random trades
    for (let i = 0; i < 20; i++) {
      const isBuy = Math.random() > 0.5;
      const price = 100 + (Math.random() * 10 - 5); // Random price around 100
      const amount = 0.1 + Math.random() * 4.9; // Random amount between 0.1 and 5

      mockTrades.push({
        id: `trade-${i}`,
        price,
        amount,
        total: price * amount,
        type: isBuy ? "buy" : "sell",
        timestamp: now - i * 60000 * Math.random() * 5, // Random times in the past
      });
    }

    // Sort by timestamp, most recent first
    mockTrades.sort((a, b) => b.timestamp - a.timestamp);

    setTrades(mockTrades);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <span className="ml-2 text-sm text-gray-500">
          Loading recent trades...
        </span>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">No recent trades found for this asset.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 text-xs text-gray-500 mb-1 px-2">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
        <div className="text-right">Time</div>
      </div>

      <div className="space-y-1">
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-4 text-sm">
            <div
              className={
                trade.type === "buy" ? "text-green-600" : "text-red-600"
              }
            >
              {formatCurrency(trade.price)}
            </div>
            <div className="text-right">{trade.amount.toFixed(4)}</div>
            <div className="text-right">{formatCurrency(trade.total)}</div>
            <div className="text-right text-gray-500">
              {formatTimeAgo(trade.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
