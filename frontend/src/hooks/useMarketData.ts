'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { Asset, AssetType, AssetPrice, AssetWithPrice } from '@/types/market';
import { fetchAssets, fetchPrices } from '@/services/market';

export const useMarketData = () => {
  const { provider, isConnected } = useWallet();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch assets from blockchain or API
      const assetData = await fetchAssets(provider);
      setAssets(assetData);
      
      // Fetch price data for all assets
      if (assetData.length > 0) {
        const priceData = await fetchPrices(assetData, provider);
        setPrices(priceData);
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
      setError('Failed to load market data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load assets when provider is available
  useEffect(() => {
    loadAssets();
  }, [provider]);

  // Refresh prices periodically
  useEffect(() => {
    if (!assets.length) return;

    const interval = setInterval(async () => {
      try {
        const priceData = await fetchPrices(assets, provider);
        setPrices(priceData);
      } catch (err) {
        console.error('Failed to update prices:', err);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [assets, provider]);

  // Helper function to combine assets with their prices
  const assetsWithPrices: AssetWithPrice[] = assets.map(asset => ({
    ...asset,
    price: prices[asset.address]?.price || 0,
    priceChange: prices[asset.address]?.change || 0,
    priceChangePercent: prices[asset.address]?.changePercent || 0,
    lastUpdated: prices[asset.address]?.timestamp || 0,
  }));

  // Filter functions
  const getStocks = () => assetsWithPrices.filter(asset => asset.assetType === AssetType.STOCK);
  const getCommodities = () => assetsWithPrices.filter(asset => asset.assetType === AssetType.COMMODITY);
  const getPaymentTokens = () => assetsWithPrices.filter(asset => asset.assetType === AssetType.PAYMENT);
  
  // Get a specific asset by address
  const getAssetByAddress = (address: string) => 
    assetsWithPrices.find(asset => asset.address.toLowerCase() === address.toLowerCase());

  return {
    assets: assetsWithPrices,
    stocks: getStocks(),
    commodities: getCommodities(),
    paymentTokens: getPaymentTokens(),
    getAssetByAddress,
    isLoading,
    error,
    refreshData: loadAssets,
  };
};