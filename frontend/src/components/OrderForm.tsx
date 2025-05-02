"use client";

import { OrderType, OrderSide } from "@/types/market";
import { formatCurrency } from "@/utils/formatters";

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
}: OrderFormProps) {
  // Determine button color and text based on order side
  const buttonColorClass =
    orderSide === OrderSide.BUY
      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
      : "bg-red-600 hover:bg-red-700 focus:ring-red-500";

  const buttonText =
    orderSide === OrderSide.BUY ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`;

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
    }
  };

  // Handle price input changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setOrderPrice(value);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Order Type Selector */}
      <div className="mb-4">
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
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount ({tokenSymbol})
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            value={orderAmount}
            onChange={handleAmountChange}
            className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      {/* Price Input (only shown for limit orders) */}
      {orderType === OrderType.LIMIT && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ({paymentSymbol})
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              value={orderPrice}
              onChange={handlePriceChange}
              className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{paymentSymbol}</span>
            </div>
          </div>
        </div>
      )}

      {/* Total Value */}
      <div className="mb-6 bg-gray-50 p-3 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Total Value</span>
          <span className="text-sm font-medium">
            {formatCurrency(total)} {paymentSymbol}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmitting ||
          !orderAmount ||
          (orderType === OrderType.LIMIT && !orderPrice)
        }
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${buttonColorClass} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSubmitting ? "Processing..." : buttonText}
      </button>
    </form>
  );
}
