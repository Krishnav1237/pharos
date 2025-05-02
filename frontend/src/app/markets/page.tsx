"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { useMarketData } from "@/hooks/useMarketData";
import { AssetType } from "@/types/market";
import {
  formatCurrency,
  formatPercent,
  formatDateTime,
} from "@/utils/formatters";

export default function MarketsPage() {
  const { assets, stocks, commodities, isLoading, error } = useMarketData();
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "commodities">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Filter assets based on active tab and search query
  const filteredAssets = (() => {
    let filtered =
      activeTab === "all"
        ? assets
        : activeTab === "stocks"
        ? stocks
        : commodities;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query)
      );
    }

    return filtered;
  })();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Markets</h1>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3 px-1 border-b-2 text-sm font-medium ${
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setActiveTab("stocks")}
            className={`py-3 px-1 border-b-2 text-sm font-medium ${
              activeTab === "stocks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setActiveTab("commodities")}
            className={`py-3 px-1 border-b-2 text-sm font-medium ${
              activeTab === "commodities"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Commodities
          </button>
        </nav>
      </div>

      {/* Loading and Error States */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading market data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No assets found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900"
                >
                  Asset
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Symbol
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                >
                  24h Change
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                >
                  Last Updated
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAssets.map((asset) => (
                <tr key={asset.address} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {asset.symbol}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        asset.assetType === AssetType.STOCK
                          ? "bg-blue-100 text-blue-800"
                          : asset.assetType === AssetType.COMMODITY
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {asset.assetType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                    {formatCurrency(asset.price)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-4 text-sm text-right ${
                      asset.priceChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <div className="flex items-center justify-end">
                      {asset.priceChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {formatCurrency(Math.abs(asset.priceChange))} (
                      {formatPercent(Math.abs(asset.priceChangePercent), 2)})
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                    {formatDateTime(asset.lastUpdated, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/trade/${asset.address}`}
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
  );
}
