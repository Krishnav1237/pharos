"use client";

import { useState, useEffect } from "react";
import { OrderType, OrderSide } from "@/types/market";
import { formatCurrency } from "@/utils/formatters";
import { useWallet } from "@/hooks/useWallet";

interface OrderFormProps {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  orderAmount: string;
  setOrderAmount: (amount: string) => void;
  orderPrice: string;
  setOrderPrice: (price: string) => void;
  orderSide: OrderSide;
  tokenSymbol: string;
  paymentSymbol: string;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  total: number;
  basePrice?: number; // Current market price
  maxAmount?: number; // Maximum available amount
}

export default function OrderForm({
  orderType,
  setOrderType,
  orderAmount,
  setOrderAmount,
  orderPrice,
  setOrderPrice,
  orderSide,
  tokenSymbol,
  paymentSymbol,
  onSubmit,
  isSubmitting,
  error,
  total,
  basePrice = 0,
  maxAmount = 0,
}: OrderFormProps) {
  const { isConnected, balance } = useWallet();
  const [showPercentages, setShowPercentages] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // Determine button color and text based on order side
  const buttonColorClass =
    orderSide === OrderSide.BUY
      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
      : "bg-red-600 hover:bg-red-700 focus:ring-red-500";

  const buttonText =
    orderSide === OrderSide.BUY ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`;

  // Effect to update price when orderType changes
  useEffect(() => {
    if (orderType === OrderType.MARKET && basePrice > 0) {
      setOrderPrice(basePrice.toString());
    }
  }, [orderType, basePrice]);

  // Handle order submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Handle amount input changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setOrderAmount(value);
      if (maxAmount > 0) {
        const percentage = (parseFloat(value || "0") / maxAmount) * 100;
        setSliderValue(Math.min(percentage, 100));
      }
    }
  };

  // Handle price input changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setOrderPrice(value);
    }
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);

    if (maxAmount > 0) {
      const amount = (value / 100) * maxAmount;
      setOrderAmount(amount.toFixed(6));
    }
  };

  // Set amount based on percentage of max
  const setAmountByPercentage = (percentage: number) => {
    if (maxAmount > 0) {
      const amount = (percentage / 100) * maxAmount;
      setOrderAmount(amount.toFixed(6));
      setSliderValue(percentage);
    }
  };

  // Check if valid input
  const isValidInput = () => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) return false;
    if (
      orderType === OrderType.LIMIT &&
      (!orderPrice || parseFloat(orderPrice) <= 0)
    )
      return false;
    return true;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Type
        </label>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-l-md ${
              orderType === OrderType.LIMIT
                ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setOrderType(OrderType.LIMIT)}
          >
            Limit
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-r-md ${
              orderType === OrderType.MARKET
                ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setOrderType(OrderType.MARKET)}
          >
            Market
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {orderType === OrderType.LIMIT
            ? "Limit orders execute at the price you set or better."
            : "Market orders execute immediately at the best available price."}
        </p>
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Amount ({tokenSymbol})
          </label>
          {maxAmount > 0 && (
            <span className="text-xs text-gray-500">
              Max: {maxAmount.toFixed(6)} {tokenSymbol}
            </span>
          )}
        </div>
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            value={orderAmount}
            onChange={handleAmountChange}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{tokenSymbol}</span>
          </div>
        </div>

        {/* Slider and Percentage Selectors */}
        {maxAmount > 0 && (
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={() => setAmountByPercentage(25)}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setAmountByPercentage(50)}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmountByPercentage(75)}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setAmountByPercentage(100)}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Max
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Price Input (only shown for limit orders) */}
      {orderType === OrderType.LIMIT ? (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Price ({paymentSymbol})
            </label>
            {basePrice > 0 && (
              <span
                className="text-xs text-indigo-600 cursor-pointer hover:underline"
                onClick={() => setOrderPrice(basePrice.toString())}
              >
                Use market price: {formatCurrency(basePrice)}
              </span>
            )}
          </div>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              value={orderPrice}
              onChange={handlePriceChange}
              className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{paymentSymbol}</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ({paymentSymbol})
          </label>
          <div className="py-2 px-3 rounded-md bg-gray-100 text-gray-700 text-sm">
            Market Price{" "}
            {basePrice > 0 ? `(~${formatCurrency(basePrice)})` : ""}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            The final price will be determined at execution time.
          </p>
        </div>
      )}

      {/* Total Value */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Total Value</span>
          <span className="text-sm font-medium">
            {formatCurrency(total)} {paymentSymbol}
          </span>
        </div>

        {isConnected && (
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
            <span className="text-xs text-gray-500">Available Balance</span>
            <span className="text-xs">
              {orderSide === OrderSide.BUY
                ? `${parseFloat(balance).toFixed(4)} ETH`
                : maxAmount > 0
                ? `${maxAmount.toFixed(6)} ${tokenSymbol}`
                : `0 ${tokenSymbol}`}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Submit Button */}
      {isConnected ? (
        <button
          type="submit"
          disabled={isSubmitting || !isValidInput()}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${buttonColorClass} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            buttonText
          )}
        </button>
      ) : (
        <button
          type="button"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 transition-colors"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("connect-wallet-requested"))
          }
        >
          Connect Wallet to Trade
        </button>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        {orderType === OrderType.LIMIT
          ? `Your ${
              orderSide === OrderSide.BUY ? "buy" : "sell"
            } order will be placed at ${
              orderPrice || "0"
            } ${paymentSymbol} per ${tokenSymbol}.`
          : `Your ${
              orderSide === OrderSide.BUY ? "buy" : "sell"
            } order will execute at the current market price.`}
      </p>
    </form>
  );
}
