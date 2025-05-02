'use client';

import { useState } from 'react';
import { OrderType, OrderSide } from '@/types/market';
import { useWallet } from './useWallet';
import { approveOrderBook, createOrder, cancelOrder } from '@/services/blockchain';
import { ethers } from 'ethers';

interface TradeParams {
  tokenAsset: string;
  paymentAsset: string;
  amount: string;
  price: string;
  orderType: OrderType;
  orderSide: OrderSide;
}

export const useTrade = () => {
  const { signer, account } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error state
  const clearError = () => setError(null);

  // Submit a trade
  const submitTrade = async (params: TradeParams) => {
    if (!signer || !account) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { tokenAsset, paymentAsset, amount, price, orderType, orderSide } = params;

      // Determine which asset needs approval based on order side
      const assetToApprove = orderSide === OrderSide.BUY 
        ? paymentAsset 
        : tokenAsset;
      
      // Calculate total amount that needs approval
      let approvalAmount: string;
      if (orderSide === OrderSide.BUY) {
        // For buy orders, approve payment asset: amount * price
        const totalCost = (parseFloat(amount) * parseFloat(price)).toString();
        approvalAmount = totalCost;
      } else {
        // For sell orders, approve token asset: amount
        approvalAmount = amount;
      }

      // Add 5% buffer to approval amount for safety
      const bufferedAmount = (parseFloat(approvalAmount) * 1.05).toString();

      // Approve the order book to spend tokens
      console.log(`Approving ${bufferedAmount} for ${assetToApprove}...`);
      const approvalTx = await approveOrderBook(assetToApprove, bufferedAmount, signer);
      console.log('Approval transaction:', approvalTx);

      // Create the order
      console.log('Creating order...');
      const orderTx = await createOrder(
        tokenAsset,
        paymentAsset,
        amount,
        price,
        orderType,
        orderSide,
        signer
      );
      console.log('Order transaction:', orderTx);

      return orderTx;
    } catch (err: any) {
      console.error('Trade error:', err);
      setError(err.message || 'Failed to submit trade');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel an existing order
  const cancelExistingOrder = async (orderId: string) => {
    if (!signer || !account) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log(`Cancelling order ${orderId}...`);
      const tx = await cancelOrder(orderId, signer);
      console.log('Cancel transaction:', tx);

      return tx;
    } catch (err: any) {
      console.error('Cancel error:', err);
      setError(err.message || 'Failed to cancel order');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitTrade,
    cancelOrder: cancelExistingOrder,
    isSubmitting,
    error,
    clearError,
  };
};