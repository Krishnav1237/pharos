"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { Tab } from "@headlessui/react";
import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "@/hooks/useWallet";
import { useMarketData } from "@/hooks/useMarketData";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTrade } from "@/hooks/useTrade";
import { OrderStatus, OrderSide } from "@/types/market";
import {
  formatCurrency,
  formatAddress,
  formatDateTime,
  formatPercent,
} from "@/utils/formatters";
import { useRenderTracker } from "@/hooks/useRenderTracker";

// Memoized components
const AssetBalanceRow = memo(({ balance }: { balance: any }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {balance.asset.symbol}
          </div>
          <div className="text-sm text-gray-500">{balance.asset.name}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
      {parseFloat(balance.balance).toFixed(6)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
      {formatCurrency(balance.balanceUsd)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <Link
        href={`/trade/${balance.asset.address}`}
        className="text-indigo-600 hover:text-indigo-900"
      >
        Trade
      </Link>
    </td>
  </tr>
));
// Add display name for AssetBalanceRow
AssetBalanceRow.displayName = "AssetBalanceRow";

const PortfolioAllocation = memo(
  ({ balances, totalValue }: { balances: any[]; totalValue: number }) => (
    <div className="space-y-4">
      {balances.map((balance) => {
        const percentage =
          totalValue > 0 ? (balance.balanceUsd / totalValue) * 100 : 0; // Added check for totalValue > 0
        return (
          <div key={balance.asset.address}>
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium">{balance.asset.symbol}</div>
              <div className="text-sm text-gray-600">
                {formatPercent(percentage, 1)}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  )
);
// Add display name for PortfolioAllocation
PortfolioAllocation.displayName = "PortfolioAllocation";

export default function PortfolioPage() {
  // Add render tracking for debugging
  useRenderTracker("PortfolioPage");

  const { account, isConnected, connect } = useWallet();
  const { assets } = useMarketData();
  const { balances, orders, totalValue, isLoading, refreshData } =
    usePortfolio(assets);
  const { cancelOrder: cancelExistingOrder, isSubmitting, error } = useTrade();

  // State for cancelling orders
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  // Stable state to prevent UI flickering
  const [stableBalances, setStableBalances] = useState(balances || []); // Initialize with empty array if undefined
  const [stableOrders, setStableOrders] = useState(orders || []); // Initialize with empty array if undefined
  const [stableTotalValue, setStableTotalValue] = useState(totalValue || 0); // Initialize with 0 if undefined

  // Debug logging
  useEffect(() => {
    console.log("PortfolioPage state:", {
      account,
      isConnected,
      assetsLength: assets?.length,
      balancesLength: balances?.length,
      ordersLength: orders?.length,
      totalValue,
      isLoading,
    });
  }, [account, isConnected, assets, balances, orders, totalValue, isLoading]);

  // Debounce updates to prevent rapid UI changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isLoading) {
      timeoutId = setTimeout(() => {
        console.log("PortfolioPage - updating stable data");
        // Ensure data is not undefined before setting
        setStableBalances(balances || []);
        setStableOrders(orders || []);
        setStableTotalValue(totalValue || 0);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        console.log("PortfolioPage - clearing timeout");
        clearTimeout(timeoutId);
      }
    };
  }, [balances, orders, totalValue, isLoading]);

  // Memoize order filtering to prevent unnecessary re-renders
  const openOrders = useCallback(() => {
    // Add null/undefined check for stableOrders
    return (stableOrders || []).filter(
      (order) =>
        order.orderStatus === OrderStatus.OPEN ||
        order.orderStatus === OrderStatus.PARTIAL_FILLED
    );
  }, [stableOrders]);

  const completedOrders = useCallback(() => {
    // Add null/undefined check for stableOrders
    return (stableOrders || []).filter(
      (order) =>
        order.orderStatus === OrderStatus.FILLED ||
        order.orderStatus === OrderStatus.CANCELLED ||
        order.orderStatus === OrderStatus.EXPIRED
    );
  }, [stableOrders]);

  // Handle order cancellation
  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      setCancellingOrderId(orderId);
      try {
        await cancelExistingOrder(orderId);
        // Wait for a moment before refreshing to avoid rapid updates
        setTimeout(() => {
          refreshData();
        }, 1000);
      } catch (err) {
        console.error("Error cancelling order:", err);
        // Optionally: Add user feedback for the error
      } finally {
        setCancellingOrderId(null);
      }
    },
    [cancelExistingOrder, refreshData]
  );

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Portfolio</h1>
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-xl font-medium mb-4">
            Connect Wallet to View Portfolio
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view your asset balances and trading history.
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // --- Render Logic ---

  // Loading state for initial data fetch
  const showInitialLoading =
    isLoading && stableBalances.length === 0 && stableOrders.length === 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {" "}
      {/* Added padding */}
      <h1 className="text-3xl font-bold mb-6">Your Portfolio</h1>
      {/* Wallet Address and Total Value */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <div className="text-gray-500 text-sm">Wallet Address</div>
            <div className="font-medium break-all sm:break-normal">
              {" "}
              {/* Added break-all for smaller screens */}
              {account ? formatAddress(account, 8) : "N/A"}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            {" "}
            {/* Aligned right */}
            <div className="text-gray-500 text-sm">Total Portfolio Value</div>
            <div className="text-2xl font-bold">
              {formatCurrency(stableTotalValue)}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Balances */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Asset Balances</h2>
            </div>

            {showInitialLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">
                  Loading your portfolio data...
                </p>
              </div>
            ) : stableBalances.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">
                  No assets found in your portfolio.
                </p>
                <Link
                  href="/markets"
                  className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
                >
                  Browse markets to start trading
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Asset
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Balance
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Value (USD)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stableBalances.map((balance) => (
                      <AssetBalanceRow
                        key={balance.asset.address}
                        balance={balance}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio Allocation</h2>

          {showInitialLoading ? ( // Use combined loading state
            <div className="flex justify-center items-center h-48">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
          ) : stableBalances.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-gray-600">No assets to display.</p>
            </div>
          ) : (
            <PortfolioAllocation
              balances={stableBalances}
              totalValue={stableTotalValue}
            />
          )}
        </div>
      </div>
      {/* Order History */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Order History</h2>
          </div>

          {showInitialLoading ? ( // Use combined loading state
            <div className="p-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">
                Loading your order history...
              </p>
            </div>
          ) : stableOrders.length === 0 && openOrders().length === 0 ? ( // Check both stable and filtered
            <div className="p-6 text-center">
              <p className="text-gray-600">No orders found.</p>
            </div>
          ) : (
            <Tab.Group>
              <Tab.List className="flex border-b border-gray-200">
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-3 px-1 text-center text-sm font-medium focus:outline-none ${ // Added focus style and center align
                      selected
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300" // Added hover border
                    }`
                  }
                >
                  Open Orders ({openOrders().length})
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-3 px-1 text-center text-sm font-medium focus:outline-none ${ // Added focus style and center align
                      selected
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300" // Added hover border
                    }`
                  }
                >
                  Order History ({completedOrders().length})
                </Tab>
              </Tab.List>

              <Tab.Panels className="mt-2">
                {" "}
                {/* Added margin top */}
                {/* Open Orders */}
                <Tab.Panel>
                  <div className="overflow-x-auto">
                    {openOrders().length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-600">No open orders.</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Asset
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Amount / Filled
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Total
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {openOrders().map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    order.orderSide === OrderSide.BUY
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {order.orderSide === OrderSide.BUY
                                    ? "BUY"
                                    : "SELL"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.tokenSymbol}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {order.orderType}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                <div>{parseFloat(order.amount).toFixed(6)}</div>
                                <div className="text-xs text-gray-400">
                                  {`${parseFloat(order.filled).toFixed(6)}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(parseFloat(order.price))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(parseFloat(order.totalValue))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    order.orderStatus === OrderStatus.OPEN
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800" // Assuming PARTIAL_FILLED uses yellow
                                  }`}
                                >
                                  {order.orderStatus.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={
                                    isSubmitting &&
                                    cancellingOrderId === order.id
                                  }
                                  className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-end" // Added flex for alignment
                                >
                                  {isSubmitting &&
                                  cancellingOrderId === order.id ? (
                                    <>
                                      <svg // Simple spinner
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
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
                                      Cancelling...
                                    </>
                                  ) : (
                                    "Cancel"
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Tab.Panel>

                {/* Completed Orders */}
                <Tab.Panel>
                  <div className="overflow-x-auto">
                    {completedOrders().length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-600">
                          No completed orders in your history.
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Asset
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Amount / Filled
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Avg Price
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Total Value
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completedOrders().map((order) => {
                            const filledAmount = parseFloat(order.filled);
                            const avgPrice =
                              filledAmount > 0
                                ? parseFloat(order.totalValue) / filledAmount // Assuming totalValue is for the filled amount
                                : parseFloat(order.price); // Fallback to order price if not filled
                            const totalFilledValue = avgPrice * filledAmount;

                            return (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      order.orderSide === OrderSide.BUY
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {order.orderSide === OrderSide.BUY
                                      ? "BUY"
                                      : "SELL"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {order.tokenSymbol}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {order.orderType}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                  <div>
                                    {parseFloat(order.amount).toFixed(6)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {`${filledAmount.toFixed(6)}`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {formatCurrency(avgPrice)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                  {formatCurrency(totalFilledValue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      order.orderStatus === OrderStatus.FILLED
                                        ? "bg-green-100 text-green-800"
                                        : order.orderStatus ===
                                          OrderStatus.CANCELLED
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-red-100 text-red-800" // EXPIRED or other terminal states
                                    }`}
                                  >
                                    {order.orderStatus.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                  {formatDateTime(order.timestamp, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          )}
        </div>
      </div>
    </div>
  );
}
