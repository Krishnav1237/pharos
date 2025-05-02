import { ethers } from 'ethers';
import { AssetType, OrderType, OrderSide, OrderStatus } from '@/types/market';

// ABI definitions for our smart contracts
// These ABIs are simplified for this example and should be replaced with actual ABIs
const AssetRegistryABI = [
  'function getAssetCount() external view returns (uint256)',
  'function getAssetByIndex(uint256 _index) external view returns (address assetAddress, string memory name, string memory symbol, uint8 assetType, bool isActive)',
  'function getActiveAssetsByType(uint8 _assetType) external view returns (address[] memory)',
];

const StockTokenABI = [
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function companyName() external view returns (string memory)',
  'function ticker() external view returns (string memory)',
  'function companyDescription() external view returns (string memory)',
  'function maxSupply() external view returns (uint256)',
  'function isTradable() external view returns (bool)',
  'function assetRegistry() external view returns (address)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const CommodityTokenABI = [
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function commodityName() external view returns (string memory)',
  'function commoditySymbol() external view returns (string memory)',
  'function commodityDescription() external view returns (string memory)',
  'function commodityCategory() external view returns (string memory)',
  'function standardUnit() external view returns (uint256)',
  'function maxSupply() external view returns (uint256)',
  'function isTradable() external view returns (bool)',
  'function assetRegistry() external view returns (address)',
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const OrderBookABI = [
  'function createOrder(address _tokenAsset, address _paymentAsset, uint256 _amount, uint256 _price, uint8 _orderType, uint8 _orderSide) external returns (uint256)',
  'function createOrderWithExpiry(address _tokenAsset, address _paymentAsset, uint256 _amount, uint256 _price, uint8 _orderType, uint8 _orderSide, uint256 _expiryDuration) external returns (uint256)',
  'function cancelOrder(uint256 _orderId) external',
  'function getBestPrices(address _tokenAsset, address _paymentAsset) external view returns (uint256 bestBuyPrice, uint256 bestSellPrice)',
  'function getTraderOrders(address trader, uint256 offset, uint256 limit) external view returns (uint256[] memory)',
  'function orders(uint256 orderId) external view returns (uint256 id, address trader, address tokenAsset, address paymentAsset, uint256 amount, uint256 price, uint256 filled, uint256 timestamp, uint256 expiry, uint8 orderType, uint8 orderSide, uint8 status)',
];

const PriceFeedABI = [
  'function getLatestPrice(address asset) external view returns (uint256 price, uint256 timestamp, bool isStale)',
  'function getFreshPrice(address asset) external view returns (uint256 price, uint256 timestamp, bool isStale, bool success)',
];

// Contract addresses - these should be loaded from environment variables or a config file
// For development, we're using placeholder addresses
const CONTRACT_ADDRESSES = {
  assetRegistry: '0x123...', // Replace with actual address
  orderBook: '0x456...', // Replace with actual address
  priceFeed: '0x789...', // Replace with actual address
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

// Get all assets from the registry
export const getAssets = async (provider: ethers.providers.Web3Provider) => {
  try {
    const assetRegistryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.assetRegistry,
      AssetRegistryABI,
      provider
    );

    const assetCount = await assetRegistryContract.getAssetCount();
    const assets = [];

    for (let i = 0; i < assetCount; i++) {
      const [address, name, symbol, assetTypeNum, isActive] = await assetRegistryContract.getAssetByIndex(i);
      
      if (!isActive) continue; // Skip inactive assets

      const assetType = mapAssetType(assetTypeNum);
      
      // Fetch additional details based on asset type
      let assetDetails;
      
      if (assetType === AssetType.STOCK) {
        const stockContract = new ethers.Contract(address, StockTokenABI, provider);
        assetDetails = {
          companyName: await stockContract.companyName(),
          ticker: await stockContract.ticker(),
          description: await stockContract.companyDescription(),
          maxSupply: await stockContract.maxSupply(),
          isTradable: await stockContract.isTradable(),
        };
      } else if (assetType === AssetType.COMMODITY) {
        const commodityContract = new ethers.Contract(address, CommodityTokenABI, provider);
        assetDetails = {
          commodityName: await commodityContract.commodityName(),
          commoditySymbol: await commodityContract.commoditySymbol(),
          description: await commodityContract.commodityDescription(),
          commodityCategory: await commodityContract.commodityCategory(),
          standardUnit: await commodityContract.standardUnit(),
          maxSupply: await commodityContract.maxSupply(),
          isTradable: await commodityContract.isTradable(),
        };
      } else {
        // Payment tokens have simpler details
        assetDetails = {
          description: `${name} payment token`,
          maxSupply: ethers.constants.MaxUint256.toString(),
          isTradable: true,
        };
      }

      // Add to assets list
      assets.push({
        address,
        name,
        symbol,
        assetType,
        ...assetDetails,
      });
    }

    return assets;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

// Get latest price for a specific asset
export const getAssetPrice = async (
  assetAddress: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
    const priceFeedContract = new ethers.Contract(
      CONTRACT_ADDRESSES.priceFeed,
      PriceFeedABI,
      provider
    );

    const [price, timestamp, isStale] = await priceFeedContract.getLatestPrice(assetAddress);
    
    // For this simplified example, we're not handling the actual price change calculation
    // In a real app, you would store previous prices or fetch them from an API
    return {
      price: ethers.utils.formatUnits(price, 18),
      timestamp: timestamp.toNumber(),
      isStale,
      change: 0, // Placeholder
      changePercent: 0, // Placeholder
    };
  } catch (error) {
    console.error(`Error fetching price for ${assetAddress}:`, error);
    throw error;
  }
};

// Get user balance for a specific asset
export const getAssetBalance = async (
  assetAddress: string,
  userAddress: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
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
    throw error;
  }
};

// Approve the OrderBook contract to spend tokens
export const approveOrderBook = async (
  assetAddress: string,
  amount: string,
  signer: ethers.Signer
) => {
  try {
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
    // In a real implementation, you would parse events to get the order ID
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
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      signer
    );

    const tx = await orderBookContract.cancelOrder(orderId);
    return await tx.wait();
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
    const orderBookContract = new ethers.Contract(
      CONTRACT_ADDRESSES.orderBook,
      OrderBookABI,
      provider
    );

    // First, get all order IDs for the user
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
    throw error;
  }
};

// Get best buy and sell prices for a trading pair
export const getBestPrices = async (
  tokenAsset: string,
  paymentAsset: string,
  provider: ethers.providers.Web3Provider
) => {
  try {
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
    throw error;
  }
};