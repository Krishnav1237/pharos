"use client";

import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react"; // Added useRef
import Link from "next/link";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  TableCellsIcon, // Added for Table View Icon
  Squares2X2Icon, // Added for Grid View Icon
  XMarkIcon, // Added for closing filter menu
} from "@heroicons/react/24/solid";
import { useMarketData } from "@/hooks/useMarketData";
import { AssetType } from "@/types/market"; // Assuming AssetType is defined here
import {
  formatCurrency,
  formatPercent,
  formatDateTime,
} from "@/utils/formatters";
import { useRenderTracker } from "@/hooks/useRenderTracker";

// Define a specific type for the asset
interface Asset {
  address: string;
  name: string;
  symbol: string;
  assetType: AssetType;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: number | string | Date; // Allow different date types
  // Add other relevant properties if needed (e.g., volume, marketCap)
}

// Type for sort configuration key
type SortKey = "name" | "symbol" | "price" | "change";

// Memoized components
const MarketRow = memo(({ asset }: { asset: Asset }) => {
  // Use Asset type
  useRenderTracker(`MarketRow-${asset.symbol}`);
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-100">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="font-medium text-gray-900">{asset.name}</div>
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
              : "bg-green-100 text-green-800" // Assuming other types like PAYMENT
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
            <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          )}
          {/* Assuming priceChangePercent is like 5 for 5% */}
          <span className="whitespace-nowrap">
            {formatCurrency(Math.abs(asset.priceChange))} (
            {formatPercent(Math.abs(asset.priceChangePercent) / 100, 2)})
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
        {formatDateTime(asset.lastUpdated, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <Link
          href={`/trade/${asset.address}`}
          className="text-indigo-600 hover:text-indigo-900 hover:underline" // Added underline on hover
        >
          Trade<span className="sr-only">, {asset.name}</span>
        </Link>
      </td>
    </tr>
  );
});
// Add display name
MarketRow.displayName = "MarketRow";

const MarketCard = memo(({ asset }: { asset: Asset }) => {
  // Use Asset type
  useRenderTracker(`MarketCard-${asset.symbol}`);
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition duration-150 ease-in-out">
      <div className="p-5">
        {" "}
        {/* Adjusted padding */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate">
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
                    : asset.assetType === AssetType.COMMODITY
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {asset.assetType}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-lg font-bold">
              {formatCurrency(asset.price)}
            </div>
            <div
              className={`flex items-center justify-end text-sm ${
                asset.priceChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {asset.priceChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              )}
              {/* Assuming priceChangePercent is like 5 for 5% */}
              {formatPercent(Math.abs(asset.priceChangePercent) / 100, 2)}
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

        <div className="mt-5">
          {" "}
          {/* Adjusted margin */}
          <Link
            href={`/trade/${asset.address}`}
            className="block w-full py-2 bg-indigo-600 text-white rounded-lg text-center font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out" // Changed style for primary action
          >
            Trade Now
          </Link>
        </div>
      </div>
    </div>
  );
});
// Add display name
MarketCard.displayName = "MarketCard";

export default function MarketsPage() {
  useRenderTracker("MarketsPage");

  // Assuming useMarketData returns Asset[]
  const { assets, stocks, commodities, isLoading, error } = useMarketData();
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "commodities">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey; // Use the SortKey type
    direction: "ascending" | "descending";
  }>({
    key: "price", // Default sort key
    direction: "descending",
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [priceRangeFilter, setPriceRangeFilter] = useState<[number, number]>([
    0, 5000,
  ]);
  const [maxPriceRange, setMaxPriceRange] = useState(5000);
  const filterMenuRef = useRef<HTMLDivElement>(null); // Ref for filter menu

  // Calculate max price range and initialize filter
  useEffect(() => {
    const allAssets = assets || []; // Ensure it's an array
    if (allAssets.length > 0) {
      const prices = allAssets.map((asset) => asset?.price ?? 0); // Handle potential null/undefined prices
      const highestPrice = Math.max(...prices);
      // Set a sensible max range, avoid Infinity if highestPrice is 0
      const newMaxRange =
        highestPrice > 0 ? Math.ceil(highestPrice * 1.2) : 5000;
      setMaxPriceRange(newMaxRange);
      // Only set initial filter if it hasn't been manually changed
      setPriceRangeFilter((prev) =>
        prev[1] === 5000 ? [0, newMaxRange] : prev
      );
    }
  }, [assets]); // Depend only on assets

  // Close filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        // Check if the click target is the filter button itself
        const filterButton = document.getElementById("filter-button");
        if (!filterButton || !filterButton.contains(event.target as Node)) {
          setFilterMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterMenuRef]); // Add filterMenuRef dependency

  // Memoize filtered and sorted assets
  const filteredAssets = useMemo(() => {
    // Ensure initial data are arrays
    const baseAssets: Asset[] =
      activeTab === "all"
        ? assets || []
        : activeTab === "stocks"
        ? stocks || []
        : commodities || [];

    let filtered = baseAssets;

    // Apply search filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(
      (asset) =>
        (asset.price ?? 0) >= priceRangeFilter[0] &&
        (asset.price ?? 0) <= priceRangeFilter[1]
    );

    // Apply sorting
    const sortableList = [...filtered]; // Create a copy
    sortableList.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      // Use nullish coalescing for safety
      switch (sortConfig.key) {
        case "name":
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
          break;
        case "symbol":
          aValue = a.symbol?.toLowerCase();
          bValue = b.symbol?.toLowerCase();
          break;
        case "price":
          aValue = a.price ?? 0;
          bValue = b.price ?? 0;
          break;
        case "change":
          aValue = a.priceChangePercent ?? 0;
          bValue = b.priceChangePercent ?? 0;
          break;
        default: // Should not happen with SortKey type, but good fallback
          aValue = a.price ?? 0;
          bValue = b.price ?? 0;
      }

      // Handle comparison for strings and numbers
      if (aValue === undefined || aValue === null) return 1; // Put undefined/null last
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0; // Values are equal
    });

    return sortableList;
  }, [
    assets,
    stocks,
    commodities,
    activeTab,
    searchQuery,
    priceRangeFilter,
    sortConfig,
  ]);

  // Request sort
  const requestSort = useCallback(
    (key: SortKey) => {
      // Use SortKey type
      let direction: "ascending" | "descending" = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig] // Dependency is correct
  );

  // Get sort direction indicator
  const getSortIndicator = useCallback(
    (key: SortKey) => {
      // Use SortKey type
      if (sortConfig.key !== key) {
        // Return a placeholder for spacing or null
        return <ArrowsUpDownIcon className="h-4 w-4 ml-1 text-gray-300" />;
      }

      return sortConfig.direction === "ascending" ? (
        <ArrowUpIcon className="h-4 w-4 ml-1 text-gray-600" />
      ) : (
        <ArrowDownIcon className="h-4 w-4 ml-1 text-gray-600" />
      );
    },
    [sortConfig] // Dependency is correct
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: "all" | "stocks" | "commodities") => {
      setActiveTab(tab);
      // Optionally reset search/filters/sort when changing tabs
      // setSearchQuery('');
      // setSortConfig({ key: 'price', direction: 'descending' });
    },
    []
  );

  // --- Render Logic ---

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Markets</h1>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0 sm:max-w-xs md:max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="search"
              className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search markets"
            />
          </div>

          {/* View Controls */}
          <div className="flex space-x-2 items-center">
            {/* Table View Button */}
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors duration-150 ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}
              title="Table View"
              aria-pressed={viewMode === "table"}
            >
              <TableCellsIcon className="w-5 h-5" />
              <span className="sr-only">Table View</span>
            </button>
            {/* Grid View Button */}
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors duration-150 ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}
              title="Grid View"
              aria-pressed={viewMode === "grid"}
            >
              <Squares2X2Icon className="w-5 h-5" />
              <span className="sr-only">Grid View</span>
            </button>
            {/* Filter Button & Menu */}
            <div className="relative">
              <button
                id="filter-button" // Added ID for click outside logic
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`p-2 rounded-md transition-colors duration-150 ${
                  filterMenuOpen
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                }`}
                title="Filter Options"
                aria-haspopup="true"
                aria-expanded={filterMenuOpen}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span className="sr-only">Filter Options</span>
              </button>

              {/* Filter Menu */}
              {filterMenuOpen && (
                <div
                  ref={filterMenuRef}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 p-4 z-20" // Increased z-index
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-medium text-gray-800">
                      Filters
                    </h3>
                    <button
                      onClick={() => setFilterMenuOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      aria-label="Close filters"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="price-range-min"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Price Range ({formatCurrency(priceRangeFilter[0])} -{" "}
                      {formatCurrency(priceRangeFilter[1])})
                    </label>
                    {/* Consider using a range slider component here for better UX */}
                    <div className="flex items-center space-x-2">
                      <input
                        id="price-range-min"
                        type="number"
                        min="0"
                        max={priceRangeFilter[1]} // Ensure min <= max
                        value={priceRangeFilter[0]}
                        onChange={(e) => {
                          const newMin = Math.max(0, Number(e.target.value));
                          setPriceRangeFilter([
                            newMin,
                            Math.max(newMin, priceRangeFilter[1]), // Ensure max >= new min
                          ]);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        aria-label="Minimum price"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        min={priceRangeFilter[0]} // Ensure max >= min
                        max={maxPriceRange}
                        value={priceRangeFilter[1]}
                        onChange={(e) => {
                          const newMax = Math.min(
                            maxPriceRange,
                            Number(e.target.value)
                          );
                          setPriceRangeFilter([
                            Math.min(newMax, priceRangeFilter[0]), // Ensure min <= new max
                            newMax,
                          ]);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                        aria-label="Maximum price"
                      />
                    </div>
                    {/* Optional: Range slider input */}
                    <input
                      type="range"
                      min="0"
                      max={maxPriceRange}
                      value={priceRangeFilter[1]} // Control max value with slider
                      onChange={(e) =>
                        setPriceRangeFilter([
                          priceRangeFilter[0],
                          Number(e.target.value),
                        ])
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                      aria-label="Maximum price slider"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setPriceRangeFilter([0, maxPriceRange]);
                        // Don't close menu on reset, let user apply or close explicitly
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setFilterMenuOpen(false)} // Apply happens implicitly by state change
                      className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Done
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
        <nav className="-mb-px flex space-x-8" aria-label="Asset Type Tabs">
          <button
            onClick={() => handleTabChange("all")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none focus:ring-indigo-500 focus:ring-offset-2 rounded-t-sm ${
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "all" ? "page" : undefined}
          >
            All Markets
          </button>
          <button
            onClick={() => handleTabChange("stocks")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none focus:ring-indigo-500 focus:ring-offset-2 rounded-t-sm ${
              activeTab === "stocks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "stocks" ? "page" : undefined}
          >
            Stocks
          </button>
          <button
            onClick={() => handleTabChange("commodities")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium focus:outline-none focus:ring-indigo-500 focus:ring-offset-2 rounded-t-sm ${
              activeTab === "commodities"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={activeTab === "commodities" ? "page" : undefined}
          >
            Commodities
          </button>
        </nav>
      </div>

      {/* Market Stats Card - Placeholder Data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="p-3 border-r border-gray-100 last:border-r-0">
          <h3 className="text-sm text-gray-500">Markets Displayed</h3>
          <p className="text-2xl font-bold mt-1">{filteredAssets.length}</p>
        </div>
        <div className="p-3 border-r border-gray-100 last:border-r-0">
          <h3 className="text-sm text-gray-500">Total 24h Volume</h3>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(12500000)}
          </p>{" "}
          {/* Replace with actual data */}
        </div>
        <div className="p-3">
          <h3 className="text-sm text-gray-500">Last Updated</h3>
          <p className="text-lg font-medium mt-1">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>{" "}
          {/* Replace with actual data */}
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading market data...</p>
        </div>
      ) : error ? (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="text-sm mt-2">
            Could not load market data. Please try refreshing the page or
            contact support.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No Assets Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || priceRangeFilter[1] !== maxPriceRange
              ? "Try adjusting your search or filter criteria."
              : `No assets available in the "${activeTab}" category.`}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        <button
                          onClick={() => requestSort("name")}
                          className="flex items-center group"
                        >
                          Asset
                          {getSortIndicator("name")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          onClick={() => requestSort("symbol")}
                          className="flex items-center group"
                        >
                          Symbol
                          {getSortIndicator("symbol")}
                        </button>
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
                        <button
                          onClick={() => requestSort("price")}
                          className="flex items-center justify-end w-full group"
                        >
                          Price
                          {getSortIndicator("price")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        <button
                          onClick={() => requestSort("change")}
                          className="flex items-center justify-end w-full group"
                        >
                          24h Change
                          {getSortIndicator("change")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        Last Updated
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredAssets.map((asset) => (
                      <MarketRow key={asset.address} asset={asset} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {" "}
          {/* Adjusted gap */}
          {filteredAssets.map((asset) => (
            <MarketCard key={asset.address} asset={asset} />
          ))}
        </div>
      )}

      {/* Pagination Placeholder */}
      {filteredAssets.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg mt-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              disabled // Placeholder
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled // Placeholder
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredAssets.length}</span> of{" "}
                <span className="font-medium">{filteredAssets.length}</span>{" "}
                results
              </p>
              {/* Add 'Total Assets: X' if different from filtered */}
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  disabled // Placeholder
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDownIcon
                    className="h-5 w-5 rotate-90"
                    aria-hidden="true"
                  />
                </button>
                {/* Current Page */}
                <button
                  aria-current="page"
                  className="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  1
                </button>
                {/* Add more page numbers if implementing pagination */}
                <button
                  disabled // Placeholder
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronDownIcon
                    className="h-5 w-5 -rotate-90"
                    aria-hidden="true"
                  />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
