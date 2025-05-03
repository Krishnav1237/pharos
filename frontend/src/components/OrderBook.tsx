"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { fetchBestPrices } from "@/services/market";
import { formatCurrency } from "@/utils/formatters";

interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
}

interface OrderBookProps {
  tokenAsset: string;
  paymentAsset: string;
}

export default function OrderBook({
  tokenAsset,
  paymentAsset,
}: OrderBookProps) {
  const { provider } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [bestBuyPrice, setBestBuyPrice] = useState("0");
  const [bestSellPrice, setBestSellPrice] = useState("0");
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([]);

  // Fetch best prices from the order book
  useEffect(() => {
    const loadOrderBook = async () => {
      try {
        setIsLoading(true);

        const { bestBuyPrice, bestSellPrice } = await fetchBestPrices(
          tokenAsset,
          paymentAsset,
          provider
        );

        setBestBuyPrice(bestBuyPrice);
        setBestSellPrice(bestSellPrice);

        // Generate mock order book data based on best prices
        // In a real implementation, you would fetch actual orders from the blockchain
        generateMockOrderBook(bestBuyPrice, bestSellPrice);
      } catch (error) {
        console.error("Error loading order book:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderBook();

    // Set up polling to refresh order book data
    const interval = setInterval(loadOrderBook, 10000);
    return () => clearInterval(interval);
  }, [tokenAsset, paymentAsset, provider]);

  // Generate mock order book data for demonstration
  // In a real implementation, this would be replaced with actual order data
  const generateMockOrderBook = (buyPrice: string, sellPrice: string) => {
    const buyPriceNum = parseFloat(buyPrice);
    const sellPriceNum = parseFloat(sellPrice);

    // Generate buy orders (bids)
    const bids: OrderBookEntry[] = [];
    let cumulativeAmount = 0;

    for (let i = 0; i < 8; i++) {
      // Generate decreasing prices for buy orders
      const price = buyPriceNum - i * 0.01 * buyPriceNum;
      // Random amount between 0.1 and 5
      const amount = Math.random() * 4.9 + 0.1;
      cumulativeAmount += amount;

      bids.push({
        price: price.toFixed(2),
        amount: amount.toFixed(4),
        total: cumulativeAmount.toFixed(4),
      });
    }

    // Generate sell orders (asks)
    const asks: OrderBookEntry[] = [];
    cumulativeAmount = 0;

    for (let i = 0; i < 8; i++) {
      // Generate increasing prices for sell orders
      const price = sellPriceNum + i * 0.01 * sellPriceNum;
      // Random amount between 0.1 and 5
      const amount = Math.random() * 4.9 + 0.1;
      cumulativeAmount += amount;

      asks.push({
        price: price.toFixed(2),
        amount: amount.toFixed(4),
        total: cumulativeAmount.toFixed(4),
      });
    }

    // Sort in descending order for sell orders (lowest first)
    asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    setBuyOrders(bids);
    setSellOrders(asks);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <span className="ml-2 text-sm text-gray-500">
          Loading order book...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 text-xs text-gray-500 mb-1 px-2">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* Sell Orders (Asks) - Displayed in reverse order (highest at the top) */}
      <div className="space-y-1 mb-4">
        {sellOrders
          .slice()
          .reverse()
          .map((order, index) => (
            <div key={`ask-${index}`} className="grid grid-cols-3 text-sm">
              <div className="text-red-600">
                {formatCurrency(parseFloat(order.price))}
              </div>
              <div className="text-right">{order.amount}</div>
              <div className="text-right">{order.total}</div>
            </div>
          ))}
      </div>

      {/* Spread */}
      <div className="border-y border-gray-200 py-2 mb-2">
        <div className="grid grid-cols-3 text-sm font-semibold">
          <div className="text-gray-700">Spread</div>
          <div className="text-right text-gray-700">
            {formatCurrency(
              Math.abs(parseFloat(bestSellPrice) - parseFloat(bestBuyPrice))
            )}
          </div>
          <div className="text-right text-gray-700">
            {(
              (Math.abs(parseFloat(bestSellPrice) - parseFloat(bestBuyPrice)) /
                parseFloat(bestSellPrice)) *
              100
            ).toFixed(2)}
            %
          </div>
        </div>
      </div>

      {/* Buy Orders (Bids) */}
      <div className="space-y-1">
        {buyOrders.map((order, index) => (
          <div key={`bid-${index}`} className="grid grid-cols-3 text-sm">
            <div className="text-green-600">
              {formatCurrency(parseFloat(order.price))}
            </div>
            <div className="text-right">{order.amount}</div>
            <div className="text-right">{order.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
