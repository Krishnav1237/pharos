'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from './useWallet';
import { Asset, OrderWithDetails } from '@/types/market';
import { getAssetBalance, getUserOrders } from '@/services/blockchain';
import { getMockOrderHistory } from '@/services/mockData';

// Use mock data in development mode
const USE_MOCK_DATA = true;

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
  
  // Keep track of initialization to prevent constant re-fetching
  const isInitialized = useRef(false);
  const prevAccount = useRef<string | null>(null);
  const prevAssetsLength = useRef<number>(0);

  // Memoize the fetchBalances function
  const fetchBalances = useCallback(async () => {
    if (!account || !provider || !assets.length) {
      setBalances([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (USE_MOCK_DATA) {
        // Generate stable mock balances based on asset addresses
        const mockBalances = assets.map(asset => {
          // Use asset address to generate stable values
          const seed = asset.address.charCodeAt(0) % 100;
          const balance = (seed + 50).toFixed(6);
          const balanceUsd = (seed * 100) + (asset.address.charCodeAt(1) % 1000);
          
          return {
            asset,
            balance,
            balanceUsd,
          };
        });
        setBalances(mockBalances);
      } else {
        // Fetch real balances from blockchain
        const balancePromises = assets.map(async (asset) => {
          try {
            const balance = await getAssetBalance(asset.address, account, provider);
            const balanceUsd = parseFloat(balance) * 100; // Mock USD value
            return { asset, balance, balanceUsd };
          } catch (err) {
            console.error(`Failed to fetch balance for ${asset.symbol}:`, err);
            return { 
              asset, 
              balance: '0', 
              balanceUsd: 0 
            };
          }
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
  }, [account, provider, assets]);

  // Memoize the fetchOrders function
  const fetchOrders = useCallback(async () => {
    if (!account || !provider) {
      setOrders([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let orderHistory;
      
      if (USE_MOCK_DATA) {
        // Generate stable mock orders
        orderHistory = getMockOrderHistory(account);
      } else {
        try {
          const rawOrders = await getUserOrders(account, provider);
          
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
        } catch (err) {
          console.error('Error fetching orders:', err);
          orderHistory = [];
        }
      }

      setOrders(orderHistory);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, assets]);

  // Calculate total portfolio value with memoization
  const getTotalValue = useCallback(() => {
    return balances.reduce((total, { balanceUsd }) => total + balanceUsd, 0);
  }, [balances]);

  // Load data only when necessary
  useEffect(() => {
    const shouldFetch = !isInitialized.current ||
                       account !== prevAccount.current ||
                       assets.length !== prevAssetsLength.current;

    if (shouldFetch && account && provider && assets.length > 0) {
      fetchBalances();
      fetchOrders();
      isInitialized.current = true;
      prevAccount.current = account;
      prevAssetsLength.current = assets.length;
    }
  }, [account, provider, assets.length, fetchBalances, fetchOrders]);

  // Memoize the return value to prevent unnecessary re-renders
  const totalValue = useRef(0);
  const currentTotalValue = getTotalValue();
  
  // Only update totalValue if it has changed significantly
  if (Math.abs(currentTotalValue - totalValue.current) > 0.01) {
    totalValue.current = currentTotalValue;
  }

  return {
    balances,
    orders,
    totalValue: totalValue.current,
    isLoading,
    error,
    refreshData: useCallback(() => {
      fetchBalances();
      fetchOrders();
    }, [fetchBalances, fetchOrders]),
  };
};