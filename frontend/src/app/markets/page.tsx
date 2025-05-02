"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
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
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "price",
    direction: "descending",
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [priceRangeFilter, setPriceRangeFilter] = useState<[number, number]>([
    0, 5000,
  ]);
  const [maxPriceRange, setMaxPriceRange] = useState(5000);

  // Determine max price range based on assets
  useEffect(() => {
    if (assets.length > 0) {
      const highestPrice = Math.max(...assets.map((asset) => asset.price));
      setMaxPriceRange(Math.ceil(highestPrice * 1.2)); // Add 20% buffer
      setPriceRangeFilter([0, Math.ceil(highestPrice * 1.2)]);
    }
  }, [assets]);

  // Sort function for assets
  const sortedAssets = (assetList) => {
    const sortableList = [...assetList];

    sortableList.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "symbol":
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "change":
          aValue = a.priceChangePercent;
          bValue = b.priceChangePercent;
          break;
        default:
          aValue = a.price;
          bValue = b.price;
      }

      if (sortConfig.direction === "ascending") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sortableList;
  };

  // Request sort
  const requestSort = (key) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filter assets based on active tab, search query, and price range
  const filteredAssets = (() => {
    let filtered =
      activeTab === "all"
        ? assets
        : activeTab === "stocks"
        ? stocks
        : commodities;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(
      (asset) =>
        asset.price >= priceRangeFilter[0] && asset.price <= priceRangeFilter[1]
    );

    // Apply sorting
    return sortedAssets(filtered);
  })();

  // Get sort direction indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === "ascending" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Markets</h1>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
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

          {/* View Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-gray-100 text-gray-600"
              }`}
              title="Table View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125V6.75m18.75 0v11.625c0 .621-.504 1.125-1.125 1.125H3.375M4.5 6.75h16.5m-16.5 0a1.125 1.125 0 0 0-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h16.5a1.125 1.125 0 0 0 1.125-1.125V7.875"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-gray-100 text-gray-600"
              }`}
              title="Grid View"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Filter Options"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>

              {/* Filter Menu */}
              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 p-4 z-10">
                  <h3 className="font-medium text-gray-700 mb-2">Filters</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={priceRangeFilter[1]}
                        value={priceRangeFilter[0]}
                        onChange={(e) =>
                          setPriceRangeFilter([
                            Number(e.target.value),
                            priceRangeFilter[1],
                          ])
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={priceRangeFilter[0]}
                        max={maxPriceRange}
                        value={priceRangeFilter[1]}
                        onChange={(e) =>
                          setPriceRangeFilter([
                            priceRangeFilter[0],
                            Number(e.target.value),
                          ])
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        setPriceRangeFilter([0, maxPriceRange]);
                        setFilterMenuOpen(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setFilterMenuOpen(false)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      {/* Market Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-xl p-4 shadow-sm">
        <div className="p-3">
          <h3 className="text-sm text-gray-500">Markets</h3>
          <p className="text-2xl font-bold">{filteredAssets.length}</p>
        </div>
        <div className="p-3">
          <h3 className="text-sm text-gray-500">24h Volume</h3>
          <p className="text-2xl font-bold">{formatCurrency(12500000)}</p>
        </div>
        <div className="p-3">
          <h3 className="text-sm text-gray-500">Last Updated</h3>
          <p className="text-lg font-medium">
            {new Date().toLocaleTimeString()}
          </p>
        </div>
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
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center">
                    Asset
                    {getSortIndicator("name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                  onClick={() => requestSort("symbol")}
                >
                  <div className="flex items-center">
                    Symbol
                    {getSortIndicator("symbol")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer"
                  onClick={() => requestSort("price")}
                >
                  <div className="flex items-center justify-end">
                    Price
                    {getSortIndicator("price")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer"
                  onClick={() => requestSort("change")}
                >
                  <div className="flex items-center justify-end">
                    24h Change
                    {getSortIndicator("change")}
                  </div>
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.address}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {asset.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500 mr-2">
                        {asset.symbol}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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
                      {asset.priceChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {formatPercent(asset.priceChangePercent, 2, true)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-700">
                      {formatDateTime(asset.lastUpdated, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Link
                    href={`/trade/${asset.address}`}
                    className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-center font-medium hover:bg-indigo-200 transition"
                  >
                    Trade Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - For future implementation */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <a
            href="#"
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </a>
          <a
            href="#"
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </a>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredAssets.length}</span> of{" "}
              <span className="font-medium">{filteredAssets.length}</span>{" "}
              results
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <a
                href="#"
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                aria-current="page"
                className="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                1
              </a>
              <a
                href="#"
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}