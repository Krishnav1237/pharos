import { Asset, AssetPrice, AssetType } from '@/types/market';

// Mock asset data for development and testing
export const getMockAssets = (): Asset[] => [
  {
    address: '0xabc123def456',
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
    address: '0xdef456abc789',
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
    address: '0x789abc012def',
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
    address: '0x012def345ghi',
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
    address: '0x345ghi678jkl',
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
    address: '0x678jkl901mno',
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
    address: '0x901mno234pqr',
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
export const getMockOrderHistory = (userAddress: string) => {
  const assets = getMockAssets();
  const mockOrders = [];

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
    
    const basePrices: Record<string, number> = {
      'AAPL': 184.92,
      'MSFT': 417.88,
      'TSLA': 174.50,
      'GOLD': 2331.45,
      'SLVR': 27.32,
      'OIL': 78.23,
      'USDC': 1.00,
    };
    
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
      orderType: isMarket ? 'MARKET' : 'LIMIT',
      orderSide: isBuy ? 'BUY' : 'SELL',
      orderStatus: isCompleted ? 'FILLED' : isPartial ? 'PARTIAL_FILLED' : isCancelled ? 'CANCELLED' : 'OPEN',
      tokenSymbol: tokenAsset.symbol,
      paymentSymbol: paymentAsset.symbol,
    });
  }
  
  return mockOrders;
};