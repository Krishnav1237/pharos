"use client";

import { useState } from "react";
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

export default function PortfolioPage() {
  const { account, isConnected, connect } = useWallet();
  const { assets } = useMarketData();
  const { balances, orders, totalValue, isLoading, refreshData } =
    usePortfolio(assets);
  const { cancelOrder: cancelExistingOrder, isSubmitting, error } = useTrade();

  // State for cancelling orders
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  // Handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await cancelExistingOrder(orderId);
      refreshData();
    } catch (err) {
      console.error("Error cancelling order:", err);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Filter orders by status
  const openOrders = orders.filter(
    (order) =>
      order.orderStatus === OrderStatus.OPEN ||
      order.orderStatus === OrderStatus.PARTIAL_FILLED
  );

  const completedOrders = orders.filter(
    (order) =>
      order.orderStatus === OrderStatus.FILLED ||
      order.orderStatus === OrderStatus.CANCELLED ||
      order.orderStatus === OrderStatus.EXPIRED
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Portfolio</h1>

      {/* Wallet Address and Total Value */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <div className="text-gray-500 text-sm">Wallet Address</div>
            <div className="font-medium">
              {account ? formatAddress(account, 8) : "N/A"}
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-gray-500 text-sm">Total Portfolio Value</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
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

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">
                  Loading your portfolio data...
                </p>
              </div>
            ) : balances.length === 0 ? (
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
                    {balances.map((balance) => (
                      <tr
                        key={balance.asset.address}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {balance.asset.symbol}
                              </div>
                              <div className="text-sm text-gray-500">
                                {balance.asset.name}
                              </div>
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

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-gray-600">No assets to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Portfolio allocation bars */}
              {balances.map((balance) => {
                const percentage = (balance.balanceUsd / totalValue) * 100;
                return (
                  <div key={balance.asset.address}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium">
                        {balance.asset.symbol}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPercent(percentage, 1)}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Order History</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">
                Loading your order history...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No orders found.</p>
            </div>
          ) : (
            <Tab.Group>
              <Tab.List className="flex border-b border-gray-200">
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-3 text-sm font-medium ${
                      selected
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  Open Orders ({openOrders.length})
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `flex-1 py-3 text-sm font-medium ${
                      selected
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  Order History ({completedOrders.length})
                </Tab>
              </Tab.List>

              <Tab.Panels>
                {/* Open Orders */}
                <Tab.Panel>
                  <div className="overflow-x-auto">
                    {openOrders.length === 0 ? (
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
                              Amount
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
                          {openOrders.map((order) => (
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
                                  {order.orderStatus ===
                                  OrderStatus.PARTIAL_FILLED
                                    ? `${parseFloat(order.filled).toFixed(
                                        6
                                      )} filled`
                                    : ""}
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
                                      : "bg-yellow-100 text-yellow-800"
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
                                  className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                                >
                                  {isSubmitting &&
                                  cancellingOrderId === order.id
                                    ? "Cancelling..."
                                    : "Cancel"}
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
                    {completedOrders.length === 0 ? (
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
                              Amount
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
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completedOrders.map((order) => (
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
                                  {order.orderStatus === OrderStatus.FILLED
                                    ? parseFloat(order.amount).toFixed(6)
                                    : parseFloat(order.filled).toFixed(6)}
                                </div>
                                {order.orderStatus === OrderStatus.FILLED &&
                                  parseFloat(order.amount) !==
                                    parseFloat(order.filled) && (
                                    <div className="text-xs text-gray-400">
                                      of {parseFloat(order.amount).toFixed(6)}
                                    </div>
                                  )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(parseFloat(order.price))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                {formatCurrency(
                                  order.orderStatus === OrderStatus.FILLED
                                    ? parseFloat(order.totalValue)
                                    : parseFloat(order.price) *
                                        parseFloat(order.filled)
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    order.orderStatus === OrderStatus.FILLED
                                      ? "bg-green-100 text-green-800"
                                      : order.orderStatus ===
                                        OrderStatus.CANCELLED
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
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
                          ))}
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
