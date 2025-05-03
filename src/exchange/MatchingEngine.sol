// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MatchingEngine.t.sol
 * @dev Handles orderBook.ts matching and trade execution for Pharos Exchange
 */
contract MatchingEngine is AccessControl, ReentrancyGuard {
    bytes32 public constant MATCHER_ROLE = keccak256("MATCHER_ROLE");

    enum OrderType { LIMIT, MARKET }
    enum OrderSide { BUY, SELL }

    struct Order {
        uint256 id;
        address trader;
        OrderSide side;
        uint256 price; // Price in base units (e.g., 18 decimals)
        uint256 quantity; // Quantity of the asset
        uint256 filled; // Quantity already filled
        OrderType orderType;
        uint256 timestamp;
    }

    uint256 public nextOrderId;
    uint256 public slippageTolerance = 200; // 2% in basis points
    mapping(uint256 => Order) public orders; // Order ID => Order
    mapping(address => uint256[]) public traderOrders; // Trader => Order IDs

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        OrderSide side,
        uint256 price,
        uint256 quantity,
        OrderType orderType
    );
    event OrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        uint256 price,
        uint256 quantity
    );
    event OrderCancelled(uint256 indexed orderId);

    constructor(address initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MATCHER_ROLE, initialOwner);
    }

    /**
     * @dev Place a new orderBook.ts
     */
    function placeOrder(
        OrderSide side,
        uint256 price,
        uint256 quantity,
        OrderType orderType
    ) external nonReentrant returns (uint256) {
        require(quantity > 0, "Quantity must be > 0");
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "Price must be > 0");
        }

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            side: side,
            price: price,
            quantity: quantity,
            filled: 0,
            orderType: orderType,
            timestamp: block.timestamp
        });
        traderOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, side, price, quantity, orderType);
        return orderId;
    }

    /**
     * @dev Match orders (buy and sell)
     */
    function matchOrders(uint256[] calldata buyOrderIds, uint256[] calldata sellOrderIds)
    external
    onlyRole(MATCHER_ROLE)
    nonReentrant
    {
        for (uint256 i = 0; i < buyOrderIds.length; i++) {
            Order storage buyOrder = orders[buyOrderIds[i]];
            require(buyOrder.side == OrderSide.BUY, "Invalid buy order");

            for (uint256 j = 0; j < sellOrderIds.length; j++) {
                Order storage sellOrder = orders[sellOrderIds[j]];
                require(sellOrder.side == OrderSide.SELL, "Invalid sell order");

                if (buyOrder.filled == buyOrder.quantity || sellOrder.filled == sellOrder.quantity) {
                    continue; // Skip fully filled orders
                }

                // Check price compatibility
                if (buyOrder.price < sellOrder.price) {
                    continue; // No match
                }

                // Determine match quantity
                uint256 matchQuantity = min(
                    buyOrder.quantity - buyOrder.filled,
                    sellOrder.quantity - sellOrder.filled
                );

                // Update orderBook.ts states
                buyOrder.filled += matchQuantity;
                sellOrder.filled += matchQuantity;

                emit OrderMatched(buyOrder.id, sellOrder.id, sellOrder.price, matchQuantity);

                // Break if buy orderBook.ts is fully filled
                if (buyOrder.filled == buyOrder.quantity) {
                    break;
                }
            }
        }
    }

    /**
     * @dev Cancel an orderBook.ts
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.filled < order.quantity, "Order already filled");

        delete orders[orderId];
        emit OrderCancelled(orderId);
    }

    /**
     * @dev Set slippage tolerance (in basis points)
     */
    function setSlippageTolerance(uint256 tolerance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tolerance > 0, "Tolerance must be > 0");
        slippageTolerance = tolerance;
    }

    /**
     * @dev Helper function to get the minimum of two values
     */
    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}