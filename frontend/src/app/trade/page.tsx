"use client";

import { useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMarketData } from "@/hooks/useMarketData";
import { AssetType } from "@/types/market"; // Assuming AssetType is defined here
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { useRenderTracker } from "@/hooks/useRenderTracker";

// Define a more specific type for the asset prop
interface Asset {
  address: string;
  name: string;
  symbol: string;
  assetType: AssetType; // Use the imported enum/type
  price: number;
  priceChange: number; // Assuming this is a number representing the change value
  priceChangePercent: number; // Assuming this is a number (e.g., 0.05 for 5%)
  description?: string; // Optional description
  // Add other relevant properties if needed, e.g., marketCap, volume, etc.
}

// Memoized component
const AssetCard = memo(({ asset }: { asset: Asset }) => {
  // Added Asset type
  useRenderTracker(`AssetCard-${asset.symbol}`); // Optional: More specific render tracking

  return (
    <Link
      href={`/trade/${asset.address}`}
      className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-150 ease-in-out" // Added duration
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {" "}
              {/* Added truncate */}
              {asset.name}
            </h3>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500 mr-2">{asset.symbol}</span>
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
          <div className="text-right flex-shrink-0 ml-2">
            {" "}
            {/* Added flex-shrink and margin */}
            <div className="text-lg font-bold">
              {formatCurrency(asset.price)}
            </div>
            <div
              className={`flex items-center justify-end text-sm ${
                asset.priceChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {/* Ensure priceChangePercent is treated as a percentage value (e.g., 5 for 5%) */}
              {formatPercent(asset.priceChangePercent / 100, 2, true)}
              {/* Or if formatPercent expects 0.05 for 5%: formatPercent(asset.priceChangePercent, 2, true) */}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 line-clamp-2 h-10">
            {" "}
            {/* Set fixed height */}
            {asset.description ||
              `Tradable ${asset.assetType.toLowerCase()} token on Pharos Exchange.`}
          </p>
        </div>

        <div className="mt-4 text-center">
          <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium group-hover:bg-indigo-100 transition">
            {" "}
            {/* Added hover effect */}
            Trade Now
          </span>
        </div>
      </div>
    </Link>
  );
});

// Add display name for AssetCard
AssetCard.displayName = "AssetCard";

export default function TradePage() {
  useRenderTracker("TradePage");

  // Assuming useMarketData returns arrays of type Asset[]
  const { assets, stocks, commodities, isLoading, error } = useMarketData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "commodities">(
    "all"
  );

  // Memoize filtered assets
  const filteredAssets = useMemo(() => {
    // Ensure initial data is an array to prevent errors
    const baseAssets: Asset[] =
      activeTab === "all"
        ? assets || []
        : activeTab === "stocks"
        ? stocks || []
        : commodities || [];

    let filtered = baseAssets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim(); // Trim whitespace
      if (query) {
        // Only filter if query is not empty
        filtered = baseAssets.filter(
          (asset) =>
            asset.name.toLowerCase().includes(query) ||
            asset.symbol.toLowerCase().includes(query)
        );
      }
    }

    // Sort by market cap or volume (simulated with price for this example)
    // Add nullish coalescing for safety
    return [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); // Create a new array for sorting
  }, [assets, stocks, commodities, activeTab, searchQuery]);

  // Memoize handlers
  const handleTabChange = useCallback(
    (tab: "all" | "stocks" | "commodities") => {
      setActiveTab(tab);
      setSearchQuery(""); // Optionally clear search on tab change
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {" "}
      {/* Added container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trade</h1>
          <p className="text-gray-600 mt-1">Select an asset to start trading</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-auto md:max-w-md">
          {" "}
          {/* Responsive width */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="search" // Use type="search" for better semantics/potential browser features
            className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" // Added sm:text-sm
            placeholder="Search assets by name or symbol..." // More specific placeholder
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {" "}
          {/* Added aria-label */}
          <button
            onClick={() => handleTabChange("all")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
              // Added focus style
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "all" ? "page" : undefined} // Accessibility
          >
            All Assets
          </button>
          <button
            onClick={() => handleTabChange("stocks")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
              // Added focus style
              activeTab === "stocks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "stocks" ? "page" : undefined} // Accessibility
          >
            Stocks
          </button>
          <button
            onClick={() => handleTabChange("commodities")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
              // Added focus style
              activeTab === "commodities"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "commodities" ? "page" : undefined} // Accessibility
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
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
          role="alert" // Accessibility
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="text-sm mt-2">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No assets found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "Try adjusting your search or filter."
              : "No assets available in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {" "}
          {/* Adjusted grid columns */}
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.address} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
