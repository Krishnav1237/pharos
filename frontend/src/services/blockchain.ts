import { ethers } from 'ethers';
import { AssetType, OrderType, OrderSide, OrderStatus } from '@/types/market';

// Contract addresses - these should be loaded from environment variables or a config file
// For development, we're using placeholder addresses
const CONTRACT_ADDRESSES = {
  assetRegistry: '0x1234567890123456789012345678901234567890', // Replace with actual address
  orderBook: '0x0987654321098765432109876543210987654321', // Replace with actual address
  priceFeed: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Replace with actual address
};

// Helper function to validate Ethereum address
const isValidAddress = (address: string): boolean => {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Helper function to convert asset type from number to enum
const mapAssetType = (typeNum: number): AssetType => {
  switch (typeNum) {
    case 0: return AssetType.STOCK;
    case 1: return AssetType.COMMODITY;
    case 2: return AssetType.PAYMENT;
    default: throw new Error(`Unknown asset type: ${typeNum}`);
  }
};

// Helper function to convert order type from number to enum
const mapOrderType = (typeNum: number): OrderType => {
  switch (typeNum) {
    case 0: return OrderType.LIMIT;
    case 1: return OrderType.MARKET;
    default: throw new Error(`Unknown order type: ${typeNum}`);
  }
};

// Helper function to convert order side from number to enum
const mapOrderSide = (sideNum: number): OrderSide => {
  switch (sideNum) {
    case 0: return OrderSide.BUY;
    case 1: return OrderSide.SELL;
    default: throw new Error(`Unknown order side: ${sideNum}`);
  }
};

// Helper function to convert order status from number to enum
const mapOrderStatus = (statusNum: number): OrderStatus => {
  switch (statusNum) {
    case 0: return OrderStatus.OPEN;
    case 1: return OrderStatus.FILLED;
    case 2: return OrderStatus.PARTIAL_FILLED;
    case 3: return OrderStatus.CANCELLED;
    case 4: return OrderStatus.EXPIRED;
    default: throw new Error(`Unknown order status: ${statusNum}`);
  }
};

// Get user balance for a specific asset
export const getAssetBalance = async (
  assetAddress: string,
  userAddress: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
    // Validate addresses
    if (!isValidAddress(assetAddress)) {
      throw new Error(`Invalid asset address: ${assetAddress}`);
    }
    
    if (!isValidAddress(userAddress)) {
      throw new Error(`Invalid user address: ${userAddress}`);
    }

    // Both token types have the same balanceOf function
    const tokenContract = new ethers.Contract(
      assetAddress,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );

    const balance = await tokenContract.balanceOf(userAddress);
    return ethers.utils.formatUnits(balance, 18);
  } catch (error) {
    console.error(`Error fetching balance for ${assetAddress}:`, error);
    return "0"; // Return 0 balance on error
  }
};

// Approve the OrderBook contract to spend tokens
export const approveOrderBook = async (
  assetAddress: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
    // Validate address
    if (!isValidAddress(assetAddress)) {
      throw new Error(`Invalid asset address: ${assetAddress}`);
    }
    
    const tokenContract = new ethers.Contract(
      assetAddress,
      ['function approve(address, uint256) returns (bool)'],
      signer
    );

    const amountWei = ethers.utils.parseUnits(amount, 18);
    const tx = await tokenContract.approve(CONTRACT_ADDRESSES.orderBook, amountWei);
    return await tx.wait();
  } catch (error) {
    console.error(`Error approving ${assetAddress}:`, error);
    throw error;
  }
};

// Create a new order
export const createOrder = async (
  tokenAsset: string,
  paymentAsset: string,
  amount: string,
  price: string,
  orderType: OrderType,
  orderSide: OrderSide,
  signer: ethers.Signer
) => {
  try {
    // Validate addresses
    if (!isValidAddress(tokenAsset) || !isValidAddress(paymentAsset)) {
      throw new Error(`Invalid asset address provided`);
    }
    
    // Simplified ABI for the contract
    const OrderBookABI = [
      'function createOrder(address _tokenAsset, address _paymentAsset, uint256 _amount, uint256 _price, uint8 _orderType, uint8 _orderSide) external returns (uint256)',
    ];
    
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      signer
    );

    const amountWei = ethers.utils.parseUnits(amount, 18);
    const priceWei = ethers.utils.parseUnits(price, 18);
    
    // Map enum values to their numerical representations
    const orderTypeNum = orderType === OrderType.LIMIT ? 0 : 1;
    const orderSideNum = orderSide === OrderSide.BUY ? 0 : 1;

    const tx = await orderBookContract.createOrder(
      tokenAsset,
      paymentAsset,
      amountWei,
      priceWei,
      orderTypeNum,
      orderSideNum
    );

    const receipt = await tx.wait();
    // For demonstration, add a transaction hash to the receipt
    receipt.transactionHash = tx.hash;
    return receipt;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Cancel an existing order
export const cancelOrder = async (
  orderId: string,
  signer: ethers.Signer
) => {
  try {
    // Simplified ABI for the contract
    const OrderBookABI = [
      'function cancelOrder(uint256 _orderId) external',
    ];
    
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      signer
    );

    const tx = await orderBookContract.cancelOrder(orderId);
    const receipt = await tx.wait();
    // For demonstration, add a transaction hash to the receipt
    receipt.transactionHash = tx.hash;
    return receipt;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw error;
  }
};

// Get all orders for a user
export const getUserOrders = async (
  userAddress: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
    // Validate user address
    if (!isValidAddress(userAddress)) {
      throw new Error(`Invalid user address: ${userAddress}`);
    }
    
    // Simplified ABI for the contract
    const OrderBookABI = [
      'function getTraderOrders(address trader, uint256 offset, uint256 limit) external view returns (uint256[] memory)',
      'function orders(uint256 orderId) external view returns (uint256 id, address trader, address tokenAsset, address paymentAsset, uint256 amount, uint256 price, uint256 filled, uint256 timestamp, uint256 expiry, uint8 orderType, uint8 orderSide, uint8 status)',
    ];
    
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      provider
    );

    // First, get all order IDs for the user (limit to 100 for this example)
    const orderIds = await orderBookContract.getTraderOrders(userAddress, 0, 100);
    
    // Then fetch details for each order
    const orders = await Promise.all(orderIds.map(async (id: string) => {
      const [
        orderId,
        trader,
        tokenAsset,
        paymentAsset,
        amount,
        price,
        filled,
        timestamp,
        expiry,
        orderTypeNum,
        orderSideNum,
        statusNum
      ] = await orderBookContract.orders(id);

      return {
        id: orderId.toString(),
        trader,
        tokenAsset,
        paymentAsset,
        amount: ethers.utils.formatUnits(amount, 18),
        price: ethers.utils.formatUnits(price, 18),
        filled: ethers.utils.formatUnits(filled, 18),
        timestamp: timestamp.toNumber(),
        expiry: expiry.toNumber(),
        orderType: mapOrderType(orderTypeNum),
        orderSide: mapOrderSide(orderSideNum),
        orderStatus: mapOrderStatus(statusNum),
      };
    }));

    return orders;
  } catch (error) {
    console.error(`Error fetching orders for ${userAddress}:`, error);
    // Return empty array on error
    return [];
  }
};

// Get best buy and sell prices for a trading pair
export const getBestPrices = async (
  tokenAsset: string,
  paymentAsset: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
    // Validate addresses
    if (!isValidAddress(tokenAsset) || !isValidAddress(paymentAsset)) {
      throw new Error(`Invalid asset address provided`);
    }
    
    // Simplified ABI for the contract
    const OrderBookABI = [
      'function getBestPrices(address _tokenAsset, address _paymentAsset) external view returns (uint256 bestBuyPrice, uint256 bestSellPrice)',
    ];
    
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      provider
    );

    const [bestBuyPrice, bestSellPrice] = await orderBookContract.getBestPrices(tokenAsset, paymentAsset);
    
    return {
      bestBuyPrice: ethers.utils.formatUnits(bestBuyPrice, 18),
      bestSellPrice: ethers.utils.formatUnits(bestSellPrice, 18),
    };
  } catch (error) {
    console.error('Error fetching best prices:', error);
    return {
      bestBuyPrice: '0',
      bestSellPrice: '0',
    };
  }
};