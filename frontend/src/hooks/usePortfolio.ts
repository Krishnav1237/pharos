'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { Asset, OrderWithDetails } from '@/types/market';
import { getAssetBalance, getUserOrders } from '@/services/blockchain';
import { getMockOrderHistory } from '@/services/mockData';

// Use mock data in development mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export interface AssetBalance {
  asset: Asset;
  balance: string;
  balanceUsd: number;
}

export const usePortfolio = (assets: Asset[]) => {
  const { account, provider } = useWallet();
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user balances for all assets
  const fetchBalances = async () => {
    if (!account || !provider || !assets.length) {
      setBalances([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (USE_MOCK_DATA) {
        // Generate mock balances for development
        const mockBalances = assets.map(asset => ({
          asset,
          balance: (Math.random() * 100).toFixed(6),
          balanceUsd: Math.random() * 10000,
        }));
        setBalances(mockBalances);
      } else {
        // Fetch real balances from blockchain
        const balancePromises = assets.map(async (asset) => {
          const balance = await getAssetBalance(asset.address, account, provider);
          // In a real app, you would fetch USD prices from an oracle or API
          const balanceUsd = parseFloat(balance) * 100; // Mock USD value
          return { asset, balance, balanceUsd };
        });

        const assetBalances = await Promise.all(balancePromises);
        setBalances(assetBalances);
      }
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError('Failed to load portfolio balances');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's order history
  const fetchOrders = async () => {
    if (!account || !provider) {
      setOrders([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let orderHistory;
      
      if (USE_MOCK_DATA) {
        // Use mock order history for development
        orderHistory = getMockOrderHistory(account);
      } else {
        // Fetch real order history from blockchain
        const rawOrders = await getUserOrders(account, provider);
        
        // Enrich order data with symbol information
        orderHistory = rawOrders.map(order => {
          const tokenAsset = assets.find(a => a.address.toLowerCase() === order.tokenAsset.toLowerCase());
          const paymentAsset = assets.find(a => a.address.toLowerCase() === order.paymentAsset.toLowerCase());
          
          return {
            ...order,
            tokenSymbol: tokenAsset?.symbol || 'Unknown',
            paymentSymbol: paymentAsset?.symbol || 'Unknown',
            remainingAmount: (parseFloat(order.amount) - parseFloat(order.filled)).toString(),
            totalValue: (parseFloat(order.amount) * parseFloat(order.price)).toString(),
            filledPercentage: (parseFloat(order.filled) / parseFloat(order.amount)) * 100,
          };
        });
      }

      setOrders(orderHistory);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total portfolio value
  const getTotalValue = () => {
    return balances.reduce((total, { balanceUsd }) => total + balanceUsd, 0);
  };

  // Load data when wallet or assets change
  useEffect(() => {
    if (account && provider && assets.length > 0) {
      fetchBalances();
      fetchOrders();
    }
  }, [account, provider, assets]);

  return {
    balances,
    orders,
    totalValue: getTotalValue(),
    isLoading,
    error,
    refreshData: () => {
      fetchBalances();
      fetchOrders();
    },
  };
};