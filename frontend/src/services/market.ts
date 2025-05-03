import { ethers } from 'ethers';
import { Asset, AssetPrice } from '@/types/market';
import * as blockchainService from './blockchain';

// Import mock data services
import { getMockAssets, getMockPrices, getHistoricalPriceData } from './mockData';

// Flag to determine if we should use mock data (for development)
const USE_MOCK_DATA = true; // Set to true for development or when blockchain connection fails

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

// Get historical price data for charts
export const fetchHistoricalPrices = async (
  assetAddress: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'day'
) => {
  // Find the asset from the mock data
  const assets = getMockAssets();
  const asset = assets.find(a => a.address === assetAddress);
  
  if (!asset) {
    return [];
  }
  
  // In a real implementation, this would query an API or indexed blockchain data
  // For now, we'll use our mock data generator
  return getHistoricalPriceData(asset.symbol, timeframe);
};