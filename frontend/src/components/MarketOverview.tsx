"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

// Mock market data - would be replaced with real data from API/blockchain
const initialMarketData = [
  {
    id: "aapl",
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 184.92,
    change: 2.35,
    changePercent: 1.29,
    type: "stock",
  },
  {
    id: "msft",
    name: "Microsoft Corporation",
    symbol: "MSFT",
    price: 417.88,
    change: -3.22,
    changePercent: -0.76,
    type: "stock",
  },
  {
    id: "gold",
    name: "Gold Bullion",
    symbol: "GOLD",
    price: 2331.45,
    change: 15.67,
    changePercent: 0.68,
    type: "commodity",
  },
  {
    id: "slvr",
    name: "Silver",
    symbol: "SLVR",
    price: 27.32,
    change: -0.45,
    changePercent: -1.62,
    type: "commodity",
  },
  {
    id: "tsla",
    name: "Tesla Inc.",
    symbol: "TSLA",
    price: 174.5,
    change: 7.28,
    changePercent: 4.35,
    type: "stock",
  },
  {
    id: "oil",
    name: "Crude Oil",
    symbol: "OIL",
    price: 78.23,
    change: -1.05,
    changePercent: -1.32,
    type: "commodity",
  },
];

export default function MarketOverview() {
  const [marketData, setMarketData] = useState(initialMarketData);
  const [activeTab, setActiveTab] = useState("all");

  // Filter assets based on active tab
  const filteredData = marketData.filter((asset) => {
    if (activeTab === "all") return true;
    return asset.type === activeTab;
  });

  // Simulate real-time updates (this would be replaced with actual data fetching)
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData((prev) =>
        prev.map((asset) => {
          const change = (Math.random() * 2 - 1) * (asset.price * 0.005);
          const newPrice = asset.price + change;
          return {
            ...asset,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(
              ((change / asset.price) * 100).toFixed(2)
            ),
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3 border-b-2 px-1 text-sm font-medium ${
              activeTab === "all"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`py-3 border-b-2 px-1 text-sm font-medium ${
              activeTab === "stock"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setActiveTab("commodity")}
            className={`py-3 border-b-2 px-1 text-sm font-medium ${
              activeTab === "commodity"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Commodities
          </button>
        </nav>
      </div>

      <div className="overflow-x-auto">
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
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                Price (USD)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
              >
                24h Change
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
            {filteredData.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                  {asset.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {asset.symbol}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                  ${asset.price.toFixed(2)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-4 text-sm text-right ${
                    asset.change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <div className="flex items-center justify-end">
                    {asset.change >= 0 ? (
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(asset.change).toFixed(2)} (
                    {Math.abs(asset.changePercent).toFixed(2)}%)
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/trade/${asset.id}`}
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
    </div>
  );
}
