"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
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
import { OrderType, OrderSide, AssetType } from "@/types/market"; // Assuming types are defined here
import {
  formatCurrency,
  formatPercent,
  formatAddress,
} from "@/utils/formatters";
import PriceChart from "@/components/PriceChart"; // Assuming this component exists
import OrderBook from "@/components/OrderBook"; // Assuming this component exists
import OrderForm from "@/components/OrderForm"; // Assuming this component exists
import RecentTrades from "@/components/RecentTrades"; // Assuming this component exists
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
  maxSupply: string | number; // Can be string or number depending on source
  isTradable: boolean;
  registrationTime: number; // Assuming Unix timestamp (seconds)
  description?: string;
  // Add other relevant properties if needed
}

// Define a type for the payment asset (subset of Asset)
interface PaymentAsset {
  address: string;
  symbol: string;
  assetType: AssetType.PAYMENT; // Specifically a payment asset
  // Add other relevant properties if needed
}

// Memoized components
const AssetHeader = memo(({ asset }: { asset: Asset }) => {
  // Use the Asset type
  useRenderTracker(`AssetHeader-${asset.symbol}`);

  // Safely parse maxSupply
  const formattedMaxSupply = useMemo(() => {
    try {
      const supplyNumber = Number(asset.maxSupply);
      return !isNaN(supplyNumber)
        ? (supplyNumber / 1e18).toLocaleString() // Format with commas
        : "N/A";
    } catch {
      return "N/A";
    }
  }, [asset.maxSupply]);

  const registrationDate = useMemo(() => {
    try {
      return new Date(asset.registrationTime * 1000).toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  }, [asset.registrationTime]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {" "}
        {/* Adjusted flex layout */}
        <div>
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <div className="flex items-center mt-1">
            <span className="text-gray-500 mr-2">{asset.symbol}</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                asset.assetType === AssetType.STOCK
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800" // Assuming non-stock is commodity/other
              }`}
            >
              {asset.assetType}
            </span>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
          {" "}
          {/* Adjusted text alignment */}
          <div className="text-2xl font-bold">
            {formatCurrency(asset.price)}
          </div>
          <div
            className={`flex items-center justify-start sm:justify-end mt-1 ${ // Adjusted justify
              asset.priceChange >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {asset.priceChange >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" /> // Added flex-shrink-0
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" /> // Added flex-shrink-0
            )}
            {/* Assuming priceChangePercent is like 5 for 5% */}
            <span className="whitespace-nowrap">
              {formatCurrency(Math.abs(asset.priceChange))} (
              {formatPercent(Math.abs(asset.priceChangePercent) / 100, 2)})
            </span>
          </div>
        </div>
      </div>

      {/* Asset details */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Contract Address</div>
          <div className="font-medium break-all">
            {formatAddress(asset.address, 6)}
          </div>{" "}
          {/* Increased chars, added break-all */}
        </div>
        <div>
          <div className="text-gray-500">Max Supply</div>
          <div className="font-medium">{formattedMaxSupply}</div>
        </div>
        <div>
          <div className="text-gray-500">Tradable</div>
          <div className="font-medium">{asset.isTradable ? "Yes" : "No"}</div>
        </div>
        <div>
          <div className="text-gray-500">Listed</div>
          <div className="font-medium">{registrationDate}</div>
        </div>
      </div>
    </div>
  );
});
// Add display name
AssetHeader.displayName = "AssetHeader";

const WalletConnectPrompt = memo(({ onConnect }: { onConnect: () => void }) => {
  useRenderTracker("WalletConnectPrompt");
  return (
    <div className="text-center py-8 px-4">
      {" "}
      {/* Added padding */}
      <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Connect Wallet to Trade
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        You need to connect your wallet to place trades on Pharos Exchange.
      </p>
      <button
        onClick={onConnect}
        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out" // Added focus styles
      >
        Connect Wallet
      </button>
    </div>
  );
});
// Add display name
WalletConnectPrompt.displayName = "WalletConnectPrompt";

export default function TradePage() {
  useRenderTracker("TradePage");

  const params = useParams();
  const assetId = params.assetId as string | undefined; // Type assertion with undefined check possibility

  // Assuming useMarketData returns Asset[]
  const { assets, getAssetByAddress, isLoading, error } = useMarketData();
  const { account, isConnected, connect } = useWallet();
  // Assuming useTrade hook provides typed error
  const { submitTrade, isSubmitting, error: tradeError } = useTrade();

  // Find asset by address in URL parameter - explicitly type the result
  const asset: Asset | undefined = useMemo(() => {
    if (!assetId) return undefined;
    return getAssetByAddress(assetId);
  }, [assetId, getAssetByAddress]);

  // Find a suitable payment asset (e.g., USDC) - explicitly type the result
  const paymentAsset: PaymentAsset | undefined = useMemo(
    () =>
      assets.find((a): a is PaymentAsset => a.assetType === AssetType.PAYMENT), // Type predicate
    [assets]
  );

  // Selected tab (Buy or Sell)
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Buy, 1 = Sell

  // Order form state
  const [orderType, setOrderType] = useState<OrderType>(OrderType.LIMIT);
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  // Set initial price when asset data is loaded or changes
  useEffect(() => {
    if (asset?.price && orderType === OrderType.LIMIT) {
      // Only set price for limit orders initially or when asset changes
      // Avoid resetting if user is typing a market order amount
      setOrderPrice(asset.price.toString());
    }
    // Reset price if switching to market order? Decide based on desired UX
    // if (orderType === OrderType.MARKET) {
    //   setOrderPrice(""); // Market orders don't need a price input
    // }
  }, [asset, orderType]); // Rerun when asset or orderType changes

  // Handle form submission
  const handleSubmitOrder = useCallback(async () => {
    // Add more robust validation
    if (
      !asset ||
      !paymentAsset ||
      !account ||
      !orderAmount ||
      (orderType === OrderType.LIMIT && !orderPrice) || // Price needed for limit
      isSubmitting
    ) {
      console.warn("Trade submission prerequisites not met.");
      // TODO: Add user feedback (e.g., toast notification)
      return;
    }

    const side = selectedTab === 0 ? OrderSide.BUY : OrderSide.SELL;
    const priceToSend = orderType === OrderType.MARKET ? "0" : orderPrice; // Send "0" or similar for market price

    try {
      await submitTrade({
        tokenAsset: asset.address,
        paymentAsset: paymentAsset.address,
        amount: orderAmount,
        price: priceToSend,
        orderType,
        orderSide: side,
      });

      // Reset form after successful submission
      setOrderAmount("");
      // Optionally reset price for limit orders, or leave it for convenience
      // if (orderType === OrderType.LIMIT) setOrderPrice(asset.price.toString());
    } catch (err) {
      console.error("Trade submission failed:", err);
      // Error is already handled by tradeError state, but you might log it here
      // TODO: Add user feedback (e.g., toast notification) based on tradeError
    }
  }, [
    asset,
    paymentAsset,
    account,
    selectedTab,
    orderAmount,
    orderPrice,
    orderType,
    submitTrade,
    isSubmitting, // Include isSubmitting dependency
  ]);

  // Calculate total order value - more robust parsing
  const calculateTotal = useMemo(() => {
    const amount = parseFloat(orderAmount);
    const price = parseFloat(orderPrice);
    if (isNaN(amount) || amount <= 0) return 0;

    if (orderType === OrderType.MARKET) {
      // For market buy, total might be based on amount * estimated market price (if available)
      // For market sell, total is amount * estimated market price
      // This calculation might need adjustment based on how market orders are handled
      return 0; // Placeholder - Market order total is often estimated or not shown upfront
    }

    // For Limit orders
    if (isNaN(price) || price <= 0) return 0;
    return amount * price;
  }, [orderAmount, orderPrice, orderType]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        {" "}
        {/* Centering */}
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading asset data...</p>
        </div>
      </div>
    );
  }

  // Handle error or asset not found after loading
  if (error || !asset) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            {error || "Asset not found."}
          </span>
          <p className="text-sm mt-2">
            Could not load data for the requested asset ({assetId || "N/A"}).
            Please check the address or try again later.
          </p>
        </div>
      </div>
    );
  }

  // Render page content if asset is loaded
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
      {" "}
      {/* Added padding */}
      {/* Left column - Asset info and chart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Asset header */}
        <AssetHeader asset={asset} />

        {/* Price chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm min-h-[300px]">
          {" "}
          {/* Added min-height */}
          <h2 className="text-lg font-semibold mb-4">Price Chart</h2>
          <PriceChart assetAddress={asset.address} />
        </div>

        {/* Order book and recent trades */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Tab.Group>
            <Tab.List className="flex border-b border-gray-200">
              <Tab
                className={({ selected }) =>
                  `w-1/2 py-3 text-center text-sm font-medium focus:outline-none ${ // Added focus style and center align
                    selected
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2" // Added hover border
                  }`
                }
              >
                Order Book
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-1/2 py-3 text-center text-sm font-medium focus:outline-none ${ // Added focus style and center align
                    selected
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2" // Added hover border
                  }`
                }
              >
                Recent Trades
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-2">
              {" "}
              {/* Added margin top */}
              <Tab.Panel className="p-2 sm:p-4">
                {" "}
                {/* Adjusted padding */}
                <OrderBook
                  tokenAsset={asset.address}
                  paymentAsset={paymentAsset?.address || ""} // Pass empty string if no payment asset
                />
              </Tab.Panel>
              <Tab.Panel className="p-2 sm:p-4">
                {" "}
                {/* Adjusted padding */}
                <RecentTrades
                  tokenAsset={asset.address}
                  paymentAsset={paymentAsset?.address || ""} // Pass empty string if no payment asset
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Right column - Order form */}
      <div className="space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          {!isConnected ? (
            <WalletConnectPrompt onConnect={connect} />
          ) : !paymentAsset ? ( // Check if payment asset exists
            <div className="text-center py-8 px-4 text-orange-700 bg-orange-50 rounded-lg">
              <InformationCircleIcon className="h-10 w-10 mx-auto mb-3" />
              <h3 className="font-medium">Payment Asset Not Found</h3>
              <p className="text-sm mt-1">
                A required payment token (e.g., USDC) could not be found.
                Trading is disabled.
              </p>
            </div>
          ) : (
            <>
              <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="flex rounded-xl bg-gray-100 p-1 space-x-1">
                  {" "}
                  {/* Added space */}
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-green-50 ring-white ring-opacity-60 ${ // Improved focus
                        selected
                          ? "bg-green-600 text-white shadow"
                          : "text-green-700 hover:bg-green-100" // Adjusted non-selected style
                      }`
                    }
                  >
                    Buy {asset.symbol}
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-red-50 ring-white ring-opacity-60 ${ // Improved focus
                        selected
                          ? "bg-red-600 text-white shadow"
                          : "text-red-700 hover:bg-red-100" // Adjusted non-selected style
                      }`
                    }
                  >
                    Sell {asset.symbol}
                  </Tab>
                </Tab.List>

                <Tab.Panels className="mt-4">
                  <Tab.Panel key="buy">
                    <OrderForm
                      orderType={orderType}
                      setOrderType={setOrderType}
                      orderAmount={orderAmount}
                      setOrderAmount={setOrderAmount}
                      orderPrice={orderPrice}
                      setOrderPrice={setOrderPrice}
                      orderSide={OrderSide.BUY}
                      tokenSymbol={asset.symbol}
                      paymentSymbol={paymentAsset.symbol} // Use guaranteed paymentAsset
                      onSubmit={handleSubmitOrder}
                      isSubmitting={isSubmitting}
                      error={tradeError}
                      total={calculateTotal}
                      // Pass other necessary props like balance, etc.
                    />
                  </Tab.Panel>
                  <Tab.Panel key="sell">
                    <OrderForm
                      orderType={orderType}
                      setOrderType={setOrderType}
                      orderAmount={orderAmount}
                      setOrderAmount={setOrderAmount}
                      orderPrice={orderPrice}
                      setOrderPrice={setOrderPrice}
                      orderSide={OrderSide.SELL}
                      tokenSymbol={asset.symbol}
                      paymentSymbol={paymentAsset.symbol} // Use guaranteed paymentAsset
                      onSubmit={handleSubmitOrder}
                      isSubmitting={isSubmitting}
                      error={tradeError}
                      total={calculateTotal}
                      // Pass other necessary props like balance, etc.
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
          <p className="text-sm text-gray-600 leading-relaxed">
            {" "}
            {/* Added leading-relaxed */}
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
