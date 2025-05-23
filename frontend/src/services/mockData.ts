import { Asset, AssetPrice, AssetType, Order, OrderSide, OrderStatus, OrderType } from '@/types/market';

// Mock asset data with valid Ethereum addresses
export const getMockAssets = (): Asset[] => [
  {
    address: '0xabc123def456789abcdef1234567890abcdef123',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    assetType: AssetType.STOCK,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    companyName: 'Apple Inc.',
    ticker: 'AAPL',
    maxSupply: '10000000000000000000000', // 10,000 tokens with 18 decimals
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 30, // 30 days ago
  },
  {
    address: '0xdef456789abcdef1234567890abcdef123456789',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    assetType: AssetType.STOCK,
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    companyName: 'Microsoft Corporation',
    ticker: 'MSFT',
    maxSupply: '10000000000000000000000',
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 25,
  },
  {
    address: '0x789abcdef1234567890abcdef1234567890abcde',
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    assetType: AssetType.STOCK,
    description: 'Tesla, Inc. designs, develops, manufactures, and sells electric vehicles and energy generation and storage systems.',
    companyName: 'Tesla Inc.',
    ticker: 'TSLA',
    maxSupply: '10000000000000000000000',
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 20,
  },
  {
    address: '0x012def3456789abcdef1234567890abcdef12345',
    name: 'Gold Token',
    symbol: 'GOLD',
    assetType: AssetType.COMMODITY,
    description: 'Tokenized representation of 1 troy ounce of 99.99% pure gold',
    commodityName: 'Gold Bullion',
    commoditySymbol: 'XAU',
    commodityCategory: 'Precious Metals',
    standardUnit: '1000000000000000000',
    maxSupply: '10000000000000000000000',
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 15,
  },
  {
    address: '0x345678abcdef1234567890abcdef1234567890ab',
    name: 'Silver Token',
    symbol: 'SLVR',
    assetType: AssetType.COMMODITY,
    description: 'Tokenized representation of 1 troy ounce of 99.9% pure silver',
    commodityName: 'Silver Bullion',
    commoditySymbol: 'XAG',
    commodityCategory: 'Precious Metals',
    standardUnit: '1000000000000000000',
    maxSupply: '10000000000000000000000',
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 10,
  },
  {
    address: '0x678901abcdef1234567890abcdef1234567890ab',
    name: 'Crude Oil Token',
    symbol: 'OIL',
    assetType: AssetType.COMMODITY,
    description: 'Tokenized representation of 1 barrel of crude oil',
    commodityName: 'Crude Oil',
    commoditySymbol: 'CRUD',
    commodityCategory: 'Energy',
    standardUnit: '1000000000000000000',
    maxSupply: '10000000000000000000000',
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 5,
  },
  {
    address: '0x90abcdef1234567890abcdef1234567890abcdef',
    name: 'USD Coin',
    symbol: 'USDC',
    assetType: AssetType.PAYMENT,
    description: 'USD Coin is a stablecoin pegged to the US Dollar',
    maxSupply: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
    isTradable: true,
    registrationTime: Date.now() / 1000 - 86400 * 60,
  }
];

// Generate random price changes for mock assets
export const getMockPrices = (assets: Asset[]): Record<string, AssetPrice> => {
  const basePrices: Record<string, number> = {
    'AAPL': 184.92,
    'MSFT': 417.88,
    'TSLA': 174.50,
    'GOLD': 2331.45,
    'SLVR': 27.32,
    'OIL': 78.23,
    'USDC': 1.00,
  };

  const priceMap: Record<string, AssetPrice> = {};
  
  assets.forEach(asset => {
    const basePrice = basePrices[asset.symbol] || 100; // Default to 100 if not found
    const change = (Math.random() * 2 - 1) * (basePrice * 0.05); // Random change up to ±5%
    const price = basePrice + change;
    
    priceMap[asset.address] = {
      price,
      change,
      changePercent: (change / basePrice) * 100,
      timestamp: Date.now() / 1000,
      volume24h: Math.random() * 1000000 + 100000,
    };
  });
  
  return priceMap;
};

// Generate mock order history for a user
export const getMockOrderHistory = (userAddress: string): Order[] => {
  const assets = getMockAssets();
  const mockOrders: Order[] = [];
  
  const basePrices: Record<string, number> = {
    'AAPL': 184.92,
    'MSFT': 417.88,
    'TSLA': 174.50,
    'GOLD': 2331.45,
    'SLVR': 27.32,
    'OIL': 78.23,
    'USDC': 1.00,
  };

  // Generate 10 random orders
  for (let i = 0; i < 10; i++) {
    const randomAssetIndex = Math.floor(Math.random() * (assets.length - 1));
    const tokenAsset = assets[randomAssetIndex];
    const paymentAsset = assets[assets.length - 1]; // USDC
    
    const isBuy = Math.random() > 0.5;
    const isMarket = Math.random() > 0.7;
    const isCompleted = Math.random() > 0.3;
    const isPartial = !isCompleted && Math.random() > 0.5;
    const isCancelled = !isCompleted && !isPartial && Math.random() > 0.5;
    
    const amount = Math.floor(Math.random() * 10) + 1;
    const price = (basePrices[tokenAsset.symbol] || 100) * (0.95 + Math.random() * 0.1);
    const filled = isCompleted ? amount : isPartial ? amount * Math.random() : 0;
    
    mockOrders.push({
      id: `${i}`,
      trader: userAddress,
      tokenAsset: tokenAsset.address,
      paymentAsset: paymentAsset.address,
      amount: amount.toString(),
      price: price.toString(),
      filled: filled.toString(),
      timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30),
      expiry: Math.floor(Date.now() / 1000) + 86400,
      orderType: isMarket ? OrderType.MARKET : OrderType.LIMIT,
      orderSide: isBuy ? OrderSide.BUY : OrderSide.SELL,
      orderStatus: isCompleted ? OrderStatus.FILLED : isPartial ? OrderStatus.PARTIAL_FILLED : isCancelled ? OrderStatus.CANCELLED : OrderStatus.OPEN,
      tokenSymbol: tokenAsset.symbol,
      paymentSymbol: paymentAsset.symbol,
      remainingAmount: (amount - filled).toString(),
      totalValue: (amount * price).toString(),
      filledPercentage: (filled / amount) * 100,
    });
  }
  
  return mockOrders;
};

// Generate historical price data for charts
export const getHistoricalPriceData = (assetSymbol: string, timeframe: 'day' | 'week' | 'month' | 'year' = 'day') => {
  const basePrices: Record<string, number> = {
    'AAPL': 184.92,
    'MSFT': 417.88,
    'TSLA': 174.50,
    'GOLD': 2331.45,
    'SLVR': 27.32,
    'OIL': 78.23,
    'USDC': 1.00,
  };
  
  const basePrice = basePrices[assetSymbol] || 100;
  const now = Date.now();
  const dataPoints = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
  const interval = timeframe === 'day' ? 3600000 : timeframe === 'week' ? 86400000 : timeframe === 'month' ? 86400000 : 86400000;
  
  const data = [];
  let price = basePrice;
  
  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = now - (i * interval);
    // Add some random fluctuation to create realistic-looking price movements
    const randomChange = (Math.random() - 0.5) * (basePrice * 0.02); // Random change up to ±2%
    price = Math.max(price + randomChange, 1); // Ensure price doesn't go below 1
    
    data.push({
      time: new Date(timestamp).toISOString(),
      price,
    });
  }
  
  return data;
};