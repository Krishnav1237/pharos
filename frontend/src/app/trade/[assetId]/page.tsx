"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tab } from "@headlessui/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useMarketData } from "@/hooks/useMarketData";
import { useWallet } from "@/hooks/useWallet";
import { useTrade } from "@/hooks/useTrade";
import { OrderType, OrderSide, AssetType } from "@/types/market";
import {
  formatCurrency,
  formatPercent,
  formatAddress,
} from "@/utils/formatters";
import PriceChart from "@/components/PriceChart";
import OrderBook from "@/components/OrderBook";
import OrderForm from "@/components/OrderForm";
import RecentTrades from "@/components/RecentTrades";

export default function TradePage() {
  const { assetId } = useParams();
  const { assets, getAssetByAddress, isLoading, error } = useMarketData();
  const { account, isConnected } = useWallet();
  const { submitTrade, isSubmitting, error: tradeError } = useTrade();

  // Find asset by address in URL parameter
  const asset = getAssetByAddress(assetId as string);

  // Find a suitable payment asset (e.g., USDC)
  const paymentAsset = assets.find((a) => a.assetType === AssetType.PAYMENT);

  // Selected tab (Buy or Sell)
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Buy, 1 = Sell

  // Order form state
  const [orderType, setOrderType] = useState<OrderType>(OrderType.LIMIT);
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  // Set initial price when asset data is loaded
  useEffect(() => {
    if (asset && asset.price) {
      setOrderPrice(asset.price.toString());
    }
  }, [asset]);

  // Handle form submission
  const handleSubmitOrder = async () => {
    if (!asset || !paymentAsset || !account) return;

    const side = selectedTab === 0 ? OrderSide.BUY : OrderSide.SELL;

    await submitTrade({
      tokenAsset: asset.address,
      paymentAsset: paymentAsset.address,
      amount: orderAmount,
      price: orderPrice,
      orderType,
      orderSide: side,
    });

    // Reset form after submission
    setOrderAmount("");
  };

  // Calculate total order value
  const calculateTotal = () => {
    if (!orderAmount || !orderPrice) return 0;
    return parseFloat(orderAmount) * parseFloat(orderPrice);
  };

  // If still loading or asset not found
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading asset data...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Asset not found or error loading data.</p>
        <p className="text-sm mt-2">
          Please try another asset or contact support if the issue persists.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Asset info and chart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Asset header */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              <div className="flex items-center mt-1">
                <span className="text-gray-500 mr-2">{asset.symbol}</span>
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
              <div className="text-2xl font-bold">
                {formatCurrency(asset.price)}
              </div>
              <div
                className={`flex items-center justify-end mt-1 ${
                  asset.priceChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {asset.priceChange >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {formatCurrency(Math.abs(asset.priceChange))} (
                {formatPercent(Math.abs(asset.priceChangePercent), 2)})
              </div>
            </div>
          </div>

          {/* Asset details */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Contract Address</div>
              <div className="font-medium">
                {formatAddress(asset.address, 4)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Max Supply</div>
              <div className="font-medium">
                {parseInt(asset.maxSupply) / 1e18}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Tradable</div>
              <div className="font-medium">
                {asset.isTradable ? "Yes" : "No"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Listed</div>
              <div className="font-medium">
                {new Date(asset.registrationTime * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Price chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Price Chart</h2>
          <PriceChart assetAddress={asset.address} />
        </div>

        {/* Order book and recent trades */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Tab.Group>
            <Tab.List className="flex border-b border-gray-200">
              <Tab
                className={({ selected }) =>
                  `w-1/2 py-3 text-sm font-medium ${
                    selected
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Order Book
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-1/2 py-3 text-sm font-medium ${
                    selected
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Recent Trades
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className="p-4">
                <OrderBook
                  tokenAsset={asset.address}
                  paymentAsset={paymentAsset?.address || ""}
                />
              </Tab.Panel>
              <Tab.Panel className="p-4">
                <RecentTrades
                  tokenAsset={asset.address}
                  paymentAsset={paymentAsset?.address || ""}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Right column - Order form */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          {!isConnected ? (
            <div className="text-center py-8">
              <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connect Wallet to Trade
              </h3>
              <p className="text-gray-500 mb-4">
                You need to connect your wallet to place trades on Pharos
                Exchange.
              </p>
              <button
                onClick={() => {
                  /* Trigger wallet connect */
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="flex rounded-xl bg-gray-100 p-1">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${
                        selected
                          ? "bg-green-600 text-white shadow"
                          : "text-gray-700 hover:bg-gray-200"
                      }`
                    }
                  >
                    Buy {asset.symbol}
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${
                        selected
                          ? "bg-red-600 text-white shadow"
                          : "text-gray-700 hover:bg-gray-200"
                      }`
                    }
                  >
                    Sell {asset.symbol}
                  </Tab>
                </Tab.List>

                <Tab.Panels className="mt-4">
                  <Tab.Panel>
                    <OrderForm
                      orderType={orderType}
                      setOrderType={setOrderType}
                      orderAmount={orderAmount}
                      setOrderAmount={setOrderAmount}
                      orderPrice={orderPrice}
                      setOrderPrice={setOrderPrice}
                      orderSide={OrderSide.BUY}
                      tokenSymbol={asset.symbol}
                      paymentSymbol={paymentAsset?.symbol || "USD"}
                      onSubmit={handleSubmitOrder}
                      isSubmitting={isSubmitting}
                      error={tradeError}
                      total={calculateTotal()}
                    />
                  </Tab.Panel>
                  <Tab.Panel>
                    <OrderForm
                      orderType={orderType}
                      setOrderType={setOrderType}
                      orderAmount={orderAmount}
                      setOrderAmount={setOrderAmount}
                      orderPrice={orderPrice}
                      setOrderPrice={setOrderPrice}
                      orderSide={OrderSide.SELL}
                      tokenSymbol={asset.symbol}
                      paymentSymbol={paymentAsset?.symbol || "USD"}
                      onSubmit={handleSubmitOrder}
                      isSubmitting={isSubmitting}
                      error={tradeError}
                      total={calculateTotal()}
                    />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </>
          )}
        </div>

        {/* Asset description */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            About {asset.name}
          </h3>
          <p className="text-gray-600">
            {asset.description ||
              `${asset.name} (${
                asset.symbol
              }) is a tokenized ${asset.assetType.toLowerCase()} available for trading on Pharos Exchange.`}
          </p>
        </div>
      </div>
    </div>
  );
}
