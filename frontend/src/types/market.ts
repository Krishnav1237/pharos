// Asset Types enum matching the blockchain contracts
export enum AssetType {
  STOCK = 'STOCK',
  COMMODITY = 'COMMODITY',
  PAYMENT = 'PAYMENT',
}

// Base Asset interface
export interface Asset {
  address: string;       // Smart contract address
  name: string;          // Full name (e.g., "Apple Inc.")
  symbol: string;        // Trading symbol (e.g., "AAPL")
  assetType: AssetType;  // Type of asset
  description?: string;  // Optional description
  maxSupply: string;     // Maximum supply (as string to handle big numbers)
  isTradable: boolean;   // Whether trading is enabled
  registrationTime: number; // Unix timestamp of when asset was registered
}

// Extended interface for stocks
export interface StockAsset extends Asset {
  assetType: AssetType.STOCK;
  companyName: string;
  ticker: string;
}

// Extended interface for commodities
export interface CommodityAsset extends Asset {
  assetType: AssetType.COMMODITY;
  commodityName: string;
  commoditySymbol: string;
  commodityCategory: string;
  standardUnit: string;
}

// Price data interface
export interface AssetPrice {
  price: number;           // Current price
  change: number;          // 24h price change (absolute)
  changePercent: number;   // 24h price change (percentage)
  timestamp: number;       // Last update timestamp
  volume24h?: number;      // Optional 24h trading volume
}

// Combined asset with price data
export interface AssetWithPrice extends Asset {
  price: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: number;
  volume24h?: number;
}

// Order types from smart contracts
export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

// Order sides from smart contracts
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

// Order status from smart contracts
export enum OrderStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  PARTIAL_FILLED = 'PARTIAL_FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Order interface matching the smart contract structure
export interface Order {
  id: string;
  trader: string;
  tokenAsset: string;
  paymentAsset: string;
  amount: string;
  price: string;
  filled: string;
  timestamp: number;
  expiry: number;
  orderType: OrderType;
  orderSide: OrderSide;
  orderStatus: OrderStatus;
}

// User-friendly order display with additional contextual information
export interface OrderWithDetails extends Order {
  tokenSymbol: string;
  paymentSymbol: string;
  remainingAmount: string;
  totalValue: string;
  filledPercentage: number;
}