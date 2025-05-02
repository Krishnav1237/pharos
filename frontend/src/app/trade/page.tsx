"use client";

import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMarketData } from "@/hooks/useMarketData";
import { AssetType } from "@/types/market";
import { formatCurrency, formatPercent } from "@/utils/formatters";

export default function TradePage() {
  const { assets, stocks, commodities, isLoading, error } = useMarketData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "commodities">(
    "all"
  );

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

    // Sort by market cap or volume (simulated with price for this example)
    return filtered.sort((a, b) => b.price - a.price);
  })();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trade</h1>
          <p className="text-gray-600 mt-1">Select an asset to start trading</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            placeholder="Search assets..."
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
            All Assets
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

      {/* Asset Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading assets...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No assets found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Link
              key={asset.address}
              href={`/trade/${asset.address}`}
              className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {asset.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500 mr-2">
                        {asset.symbol}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          asset.assetType === AssetType.STOCK
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {asset.assetType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(asset.price)}
                    </div>
                    <div
                      className={`flex items-center justify-end text-sm ${
                        asset.priceChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPercent(asset.priceChangePercent, 2, true)}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {asset.description ||
                      `Tradable ${asset.assetType.toLowerCase()} token on Pharos Exchange.`}
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                    Trade Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
