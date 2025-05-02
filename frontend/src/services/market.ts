import { ethers } from 'ethers';
import { Asset, AssetPrice } from '@/types/market';
import * as blockchainService from './blockchain';

// Fallback to mock data if blockchain connection fails or for development
import { getMockAssets, getMockPrices } from './mockData';

// Flag to determine if we should use mock data (for development)
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Fetch all available assets
export const fetchAssets = async (provider?: ethers.providers.Web3Provider | null): Promise<Asset[]> => {
  // Use mock data if no provider or if explicitly configured
  if (!provider || USE_MOCK_DATA) {
    return getMockAssets();
  }

  try {
    return await blockchainService.getAssets(provider);
  } catch (error) {
    console.error('Error fetching assets from blockchain, falling back to mock data:', error);
    return getMockAssets();
  }
};

// Fetch prices for a list of assets
export const fetchPrices = async (
  assets: Asset[],
  provider?: ethers.providers.Web3Provider | null
): Promise<Record<string, AssetPrice>> => {
  // Use mock data if no provider or if explicitly configured
  if (!provider || USE_MOCK_DATA) {
    return getMockPrices(assets);
  }

  try {
    // Create a map to store prices by asset address
    const priceMap: Record<string, AssetPrice> = {};

    // Fetch prices for each asset
    await Promise.all(
      assets.map(async (asset) => {
        try {
          const priceData = await blockchainService.getAssetPrice(asset.address, provider);
          priceMap[asset.address] = priceData;
        } catch (err) {
          console.error(`Failed to fetch price for ${asset.symbol}:`, err);
          // Use a placeholder price if fetch fails
          priceMap[asset.address] = {
            price: 0,
            change: 0,
            changePercent: 0,
            timestamp: Date.now() / 1000,
          };
        }
      })
    );

    return priceMap;
  } catch (error) {
    console.error('Error fetching prices from blockchain, falling back to mock data:', error);
    return getMockPrices(assets);
  }
};

// Get price for a specific asset
export const fetchAssetPrice = async (
  assetAddress: string,
  provider?: ethers.providers.Web3Provider | null
): Promise<AssetPrice> => {
  // Use mock data if no provider or if explicitly configured
  if (!provider || USE_MOCK_DATA) {
    const mockPrices = getMockPrices([{ address: assetAddress } as Asset]);
    return mockPrices[assetAddress];
  }

  try {
    return await blockchainService.getAssetPrice(assetAddress, provider);
  } catch (error) {
    console.error(`Error fetching price for ${assetAddress}:`, error);
    return {
      price: 0,
      change: 0,
      changePercent: 0,
      timestamp: Date.now() / 1000,
    };
  }
};

// Get best prices for a trading pair
export const fetchBestPrices = async (
  tokenAsset: string,
  paymentAsset: string,
  provider?: ethers.providers.Web3Provider | null
) => {
  // Use mock data if no provider or if explicitly configured
  if (!provider || USE_MOCK_DATA) {
    // Mock implementation
    return {
      bestBuyPrice: '1.95', // Highest buy offer
      bestSellPrice: '2.05', // Lowest sell offer
    };
  }

  try {
    return await blockchainService.getBestPrices(tokenAsset, paymentAsset, provider);
  } catch (error) {
    console.error('Error fetching best prices:', error);
    return {
      bestBuyPrice: '0',
      bestSellPrice: '0',
    };
  }
};

// Get trading volume for the last 24 hours
// This would typically require additional backend services in a real implementation
export const fetch24hVolume = async (
  tokenAsset: string,
  paymentAsset: string
): Promise<number> => {
  // In a real implementation, this would query an API or indexed blockchain data
  // For now, we'll return a mock value
  return Math.random() * 1000000;
};

// Get historical price data for charts
export const fetchHistoricalPrices = async (
  assetAddress: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day'
) => {
  // In a real implementation, this would query an API or indexed blockchain data
  // For now, we'll generate mock data
  const now = Date.now();
  const dataPoints = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
  const interval = timeframe === 'day' ? 3600000 : timeframe === 'week' ? 86400000 : timeframe === 'month' ? 86400000 : 86400000;
  
  const data = [];
  let basePrice = 100;
  
  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = now - (i * interval);
    // Add some random fluctuation to create realistic-looking price movements
    const randomChange = (Math.random() - 0.5) * 5;
    basePrice = Math.max(basePrice + randomChange, 1); // Ensure price doesn't go below 1
    
    data.push({
      time: new Date(timestamp).toISOString(),
      price: basePrice,
    });
  }
  
  return data;
};