// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OrderBook
 * @dev Optimized order book for decentralized token exchange
 */
contract OrderBook is Ownable, ReentrancyGuard, Pausable {
    // ============ Enums ============
    enum OrderType { LIMIT, MARKET }
    enum OrderSide { BUY, SELL }
    enum OrderStatus { OPEN, FILLED, PARTIAL_FILLED, CANCELLED, EXPIRED }

    // ============ Structs ============
    struct Order {
        uint256 id;
        address trader;
        address tokenAsset;
        address paymentAsset;
        uint256 amount;
        uint256 price;
        uint256 filled;
        uint256 timestamp;
        uint256 expiry;         // Optional expiration timestamp
        OrderType orderType;
        OrderSide side;
        OrderStatus status;
    }

    struct AssetPair {
        address tokenAsset;
        address paymentAsset;
        bool isActive;
        uint256 minPriceIncrement; // Minimum price increment to prevent front-running
    }

    // ============ Constants ============
    uint256 private constant MAX_PRICE_POINTS = 1000; // Limit price points array size
    uint256 private constant DEFAULT_ORDER_EXPIRY = 7 days;

    // ============ State Variables ============
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId = 1;
    mapping(bytes32 => AssetPair) public assetPairs;
    bytes32[] public assetPairKeys;

    // Optimized order storage
    mapping(bytes32 => mapping(uint256 => uint256[])) public sellOrders;
    mapping(bytes32 => mapping(uint256 => uint256[])) public buyOrders;
    mapping(bytes32 => uint256[]) public sellPricePoints;
    mapping(bytes32 => uint256[]) public buyPricePoints;

    uint256 public tradingFee = 25; // 0.25%
    address public feeCollector;
    address public matchingEngine;

    // New mappings for trader orders and order times
    mapping(address => uint256[]) private traderOrders;
    mapping(address => mapping(bytes32 => uint256[])) private traderPairOrders;

    // ============ Events ============
    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        address tokenAsset,
        address paymentAsset,
        uint256 amount,
        uint256 price,
        OrderType orderType,
        OrderSide side
    );
    event OrderCancelled(uint256 indexed orderId);
    event OrderFilled(uint256 indexed orderId, uint256 filledAmount);
    event OrderPartiallyFilled(uint256 indexed orderId, uint256 filledAmount);
    event OrderExpired(uint256 indexed orderId);
    event AssetPairAdded(bytes32 indexed pairKey, address tokenAsset, address paymentAsset, uint256 minPriceIncrement);
    event AssetPairStatusChanged(bytes32 indexed pairKey, bool isActive);
    event TradingFeeUpdated(uint256 newFee);
    event FeeCollectorUpdated(address newFeeCollector);
    event MatchingEngineUpdated(address newMatchingEngine);

    // ============ Constructor ============
    constructor(address initialOwner, address _feeCollector) Ownable(initialOwner) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    // ============ Modifiers ============
    modifier onlyMatchingEngine() {
        require(msg.sender == matchingEngine, "Not matching engine");
        _;
    }

    // ============ Admin Functions ============
    function setMatchingEngine(address _matchingEngine) external onlyOwner {
        require(_matchingEngine != address(0), "Invalid address");
        matchingEngine = _matchingEngine;
        emit MatchingEngineUpdated(_matchingEngine);
    }

    function setTradingFee(uint256 _tradingFee) external onlyOwner {
        require(_tradingFee <= 100, "Fee too high"); // Max 1%
        tradingFee = _tradingFee;
        emit TradingFeeUpdated(_tradingFee);
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    /**
     * @dev Pause the contract in emergency situations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract after emergency resolution
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    function addAssetPair(
        address _tokenAsset,
        address _paymentAsset,
        bool _isActive,
        uint256 _minPriceIncrement
    ) external onlyOwner {
        require(_tokenAsset != address(0) && _paymentAsset != address(0), "Invalid assets");
        require(_minPriceIncrement > 0, "Invalid price increment");

        bytes32 pairKey = keccak256(abi.encodePacked(_tokenAsset, _paymentAsset));
        require(assetPairs[pairKey].tokenAsset == address(0), "Pair exists");

        AssetPair memory newPair = AssetPair({
            tokenAsset: _tokenAsset,
            paymentAsset: _paymentAsset,
            isActive: _isActive,
            minPriceIncrement: _minPriceIncrement
        });

        assetPairs[pairKey] = newPair;
        assetPairKeys.push(pairKey);

        emit AssetPairAdded(pairKey, _tokenAsset, _paymentAsset, _minPriceIncrement);
    }

    function setAssetPairStatus(bytes32 _pairKey, bool _isActive) external onlyOwner {
        require(assetPairs[_pairKey].tokenAsset != address(0), "Pair not found");
        assetPairs[_pairKey].isActive = _isActive;
        emit AssetPairStatusChanged(_pairKey, _isActive);
    }

    // ============ Order Management Functions ============

    /**
     * @dev Private implementation of order creation logic
     */
    function _createOrderInternal(
        address _tokenAsset,
        address _paymentAsset,
        uint256 _amount,
        uint256 _price,
        OrderType _orderType,
        OrderSide _side,
        uint256 _expiryDuration
    ) private returns (uint256) {
        require(_amount > 0, "Amount must be > 0");

        if (_orderType == OrderType.LIMIT) {
            require(_price > 0, "Price must be > 0");
        } else {
            // For market orders, set a very high buy price or very low sell price
            _price = _side == OrderSide.BUY ? type(uint256).max : 1;
        }

        bytes32 pairKey = keccak256(abi.encodePacked(_tokenAsset, _paymentAsset));
        AssetPair storage pair = assetPairs[pairKey];
        require(pair.isActive, "Pair not active");

        // Validate price increment for front-running protection
        if (_orderType == OrderType.LIMIT && pair.minPriceIncrement > 0) {
            require(_price % pair.minPriceIncrement == 0, "Invalid price increment");
        }

        // Check balances and allowances
        if (_side == OrderSide.BUY) {
            uint256 totalCost = _price == type(uint256).max ?
                IERC20(_paymentAsset).balanceOf(msg.sender) :
                (_amount * _price) / 1e18;
            require(IERC20(_paymentAsset).balanceOf(msg.sender) >= totalCost, "Insufficient balance");
            require(IERC20(_paymentAsset).allowance(msg.sender, address(this)) >= totalCost, "Insufficient allowance");

            // Transfer tokens to contract for buy orders
            require(IERC20(_paymentAsset).transferFrom(msg.sender, address(this), totalCost), "Transfer failed");
        } else {
            require(IERC20(_tokenAsset).balanceOf(msg.sender) >= _amount, "Insufficient balance");
            require(IERC20(_tokenAsset).allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");

            // Transfer tokens to contract for sell orders
            require(IERC20(_tokenAsset).transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        }

        uint256 expiry = block.timestamp + (_expiryDuration > 0 ? _expiryDuration : DEFAULT_ORDER_EXPIRY);
        uint256 orderId = nextOrderId++;

        orders[orderId] = Order({
            id: orderId,
            trader: msg.sender,
            tokenAsset: _tokenAsset,
            paymentAsset: _paymentAsset,
            amount: _amount,
            price: _price,
            filled: 0,
            timestamp: block.timestamp,
            expiry: expiry,
            orderType: _orderType,
            side: _side,
            status: OrderStatus.OPEN
        });

        // Track trader orders for easy lookup
        traderOrders[msg.sender].push(orderId);
        traderPairOrders[msg.sender][pairKey].push(orderId);

        // Add limit orders to the order book
        if (_orderType == OrderType.LIMIT) {
            _addToOrderBook(pairKey, orders[orderId]);
        }

        emit OrderCreated(
            orderId,
            msg.sender,
            _tokenAsset,
            _paymentAsset,
            _amount,
            _price,
            _orderType,
            _side
        );

        return orderId;
    }

    /**
     * @dev Creates a new order with default expiry
     */
    function createOrder(
        address _tokenAsset,
        address _paymentAsset,
        uint256 _amount,
        uint256 _price,
        OrderType _orderType,
        OrderSide _side
    ) external whenNotPaused nonReentrant returns (uint256) {
        return _createOrderInternal(
            _tokenAsset,
            _paymentAsset,
            _amount,
            _price,
            _orderType,
            _side,
            DEFAULT_ORDER_EXPIRY
        );
    }

    /**
     * @dev Creates a new order with optional expiry
     */
    function createOrderWithExpiry(
        address _tokenAsset,
        address _paymentAsset,
        uint256 _amount,
        uint256 _price,
        OrderType _orderType,
        OrderSide _side,
        uint256 _expiryDuration
    ) external whenNotPaused nonReentrant returns (uint256) {
        return _createOrderInternal(
            _tokenAsset,
            _paymentAsset,
            _amount,
            _price,
            _orderType,
            _side,
            _expiryDuration
        );
    }

    /**
     * @dev Optimized function to add order to book with binary insertion
     */
    function _addToOrderBook(bytes32 _pairKey, Order storage _order) internal {
        uint256[] storage pricePoints;

        if (_order.side == OrderSide.BUY) {
            pricePoints = buyPricePoints[_pairKey];
        } else {
            pricePoints = sellPricePoints[_pairKey];
        }

        // Check for existing price point using binary search
        bool priceExists = false;
        int256 insertPos = -1;

        if (pricePoints.length > 0) {
            int256 low = 0;
            int256 high = int256(pricePoints.length) - 1;

            while (low <= high) {
                int256 mid = (low + high) / 2;

                if (pricePoints[uint256(mid)] == _order.price) {
                    priceExists = true;
                    break;
                } else if (
                    (_order.side == OrderSide.BUY && pricePoints[uint256(mid)] < _order.price) ||
                    (_order.side == OrderSide.SELL && pricePoints[uint256(mid)] > _order.price)
                ) {
                    high = mid - 1;
                    insertPos = mid;
                } else {
                    low = mid + 1;
                    insertPos = low;
                }
            }
        }

        // Add new price point if it doesn't exist
        if (!priceExists) {
            require(pricePoints.length < MAX_PRICE_POINTS, "Too many price points");

            if (insertPos < 0) {
                // Price point should be added at the end
                pricePoints.push(_order.price);
            } else {
                // Insert at the calculated position
                pricePoints.push(0); // Temporary value

                // Shift elements to make space for the new price
                for (uint256 i = pricePoints.length - 1; i > uint256(insertPos); i--) {
                    pricePoints[i] = pricePoints[i - 1];
                }

                // Insert the new price
                pricePoints[uint256(insertPos)] = _order.price;
            }
        }

        // Add order to list for this price
        if (_order.side == OrderSide.BUY) {
            buyOrders[_pairKey][_order.price].push(_order.id);
        } else {
            sellOrders[_pairKey][_order.price].push(_order.id);
        }
    }

    /**
     * @dev Cancel an order
     */
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(
            order.status == OrderStatus.OPEN || order.status == OrderStatus.PARTIAL_FILLED,
            "Cannot cancel"
        );

        // Compute remaining unfilled amount
        uint256 unfilled = order.amount - order.filled;

        // Mark cancelled and remove from book if needed
        order.status = OrderStatus.CANCELLED;
        if (order.orderType == OrderType.LIMIT) {
            bytes32 pairKey = keccak256(abi.encodePacked(order.tokenAsset, order.paymentAsset));
            _removeFromOrderBook(pairKey, order);
        }

        // Handle token refunds
        if (unfilled > 0) {
            if (order.side == OrderSide.SELL) {
                // For sell orders, refund the token asset with fee
                uint256 feeAmount = 0;
                if (tradingFee > 0) {
                    feeAmount = (unfilled * tradingFee) / 10000;
                }
                uint256 refundAmount = unfilled - feeAmount;

                if (feeAmount > 0) {
                    IERC20(order.tokenAsset).transfer(feeCollector, feeAmount);
                }
                if (refundAmount > 0) {
                    IERC20(order.tokenAsset).transfer(order.trader, refundAmount);
                }
            } else {
                // For buy orders, refund the payment asset with fee
                uint256 totalValue = (unfilled * order.price) / 1e18;
                uint256 feeAmount = 0;
                if (tradingFee > 0 && totalValue > 0) {
                    feeAmount = (totalValue * tradingFee) / 10000;
                }
                uint256 refundAmount = totalValue - feeAmount;

                if (feeAmount > 0) {
                    IERC20(order.paymentAsset).transfer(feeCollector, feeAmount);
                }
                if (refundAmount > 0) {
                    IERC20(order.paymentAsset).transfer(order.trader, refundAmount);
                }
            }
        }

        emit OrderCancelled(_orderId);
    }

    /**
     * @dev Efficient removal from order book
     */
    function _removeFromOrderBook(bytes32 _pairKey, Order storage _order) internal {
        uint256[] storage priceOrders = _order.side == OrderSide.BUY ?
            buyOrders[_pairKey][_order.price] :
            sellOrders[_pairKey][_order.price];

        // Find and remove the order with swap and pop
        for (uint i = 0; i < priceOrders.length; i++) {
            if (priceOrders[i] == _order.id) {
                if (i < priceOrders.length - 1) {
                    priceOrders[i] = priceOrders[priceOrders.length - 1];
                }
                priceOrders.pop();
                break;
            }
        }

        // Remove price point if no more orders at this price
        if (priceOrders.length == 0) {
            uint256[] storage pricePoints = _order.side == OrderSide.BUY ?
                buyPricePoints[_pairKey] : sellPricePoints[_pairKey];

            // Find and remove the price point
            for (uint i = 0; i < pricePoints.length; i++) {
                if (pricePoints[i] == _order.price) {
                    if (i < pricePoints.length - 1) {
                        pricePoints[i] = pricePoints[pricePoints.length - 1];
                    }
                    pricePoints.pop();

                    // Re-sort the price points after removal
                    if (pricePoints.length > 1) {
                        _quickSortPricePoints(pricePoints, 0, int256(pricePoints.length - 1), _order.side);
                    }
                    break;
                }
            }
        }
    }

    /**
     * @dev Quick sort implementation for price points
     */
    function _quickSortPricePoints(
        uint256[] storage arr,
        int256 left,
        int256 right,
        OrderSide side
    ) internal {
        if (left >= right) return;

        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        int256 i = left;
        int256 j = right;

        while (i <= j) {
            if (side == OrderSide.BUY) {
                // Descending order for buy prices
                while (arr[uint256(i)] > pivot) i++;
                while (arr[uint256(j)] < pivot) j--;
            } else {
                // Ascending order for sell prices
                while (arr[uint256(i)] < pivot) i++;
                while (arr[uint256(j)] > pivot) j--;
            }

            if (i <= j) {
                // Swap
                uint256 tmp = arr[uint256(i)];
                arr[uint256(i)] = arr[uint256(j)];
                arr[uint256(j)] = tmp;
                i++;
                j--;
            }
        }

        if (left < j) _quickSortPricePoints(arr, left, j, side);
        if (i < right) _quickSortPricePoints(arr, i, right, side);
    }

    /**
     * @dev Check and expire old orders (can be called by anyone)
     */
    function cleanupExpiredOrders(uint256[] calldata orderIds) external {
        for (uint i = 0; i < orderIds.length; i++) {
            uint256 orderId = orderIds[i];
            Order storage order = orders[orderId];

            // Only consider open or partially filled orders
            if (order.status != OrderStatus.OPEN && order.status != OrderStatus.PARTIAL_FILLED) {
                continue;
            }

            // Check if expired
            if (block.timestamp > order.expiry) {
                order.status = OrderStatus.EXPIRED;

                // Refund tokens for expired orders
                uint256 unfilled = order.amount - order.filled;
                if (unfilled > 0) {
                    if (order.side == OrderSide.SELL) {
                        // Return unsold tokens to seller
                        IERC20(order.tokenAsset).transfer(order.trader, unfilled);
                    } else {
                        // Return unspent payment to buyer
                        uint256 refundAmount = (unfilled * order.price) / 1e18;
                        if (refundAmount > 0) {
                            IERC20(order.paymentAsset).transfer(order.trader, refundAmount);
                        }
                    }
                }

                // Remove from order book if it's a limit order
                if (order.orderType == OrderType.LIMIT) {
                    bytes32 pairKey = keccak256(abi.encodePacked(order.tokenAsset, order.paymentAsset));
                    _removeFromOrderBook(pairKey, order);
                }

                emit OrderExpired(orderId);
            }
        }
    }

    /**
     * @dev Updates an order after matching
     */
    function updateOrderAfterMatch(uint256 _orderId, uint256 _filledAmount)
    external
    onlyMatchingEngine
    whenNotPaused
    {
        Order storage order = orders[_orderId];
        require(
            order.status == OrderStatus.OPEN || order.status == OrderStatus.PARTIAL_FILLED,
            "Invalid status"
        );
        require(block.timestamp <= order.expiry, "Order expired");
        require(order.filled + _filledAmount <= order.amount, "Fill exceeds amount");

        // Update filled amount
        order.filled += _filledAmount;

        // Update order status
        if (order.filled == order.amount) {
            order.status = OrderStatus.FILLED;

            // Remove from order book if it's a limit order
            if (order.orderType == OrderType.LIMIT) {
                bytes32 pairKey = keccak256(abi.encodePacked(order.tokenAsset, order.paymentAsset));
                _removeFromOrderBook(pairKey, order);
            }

            emit OrderFilled(_orderId, _filledAmount);
        } else {
            order.status = OrderStatus.PARTIAL_FILLED;
            emit OrderPartiallyFilled(_orderId, _filledAmount);
        }
    }

    // ============ View Functions ============
    /**
     * @dev Gets best prices efficiently
     */
    function getBestPrices(address _tokenAsset, address _paymentAsset)
    external
    view
    returns (uint256 bestBuyPrice, uint256 bestSellPrice)
    {
        bytes32 pairKey = keccak256(abi.encodePacked(_tokenAsset, _paymentAsset));

        // Get highest buy price (first in descending sorted array)
        if (buyPricePoints[pairKey].length > 0) {
            bestBuyPrice = buyPricePoints[pairKey][0];
        }

        // Get lowest sell price (first in ascending sorted array)
        if (sellPricePoints[pairKey].length > 0) {
            bestSellPrice = sellPricePoints[pairKey][0];
        }

        return (bestBuyPrice, bestSellPrice);
    }

    /**
     * @dev Gets orders by trader (pagination support)
     */
    function getTraderOrders(address trader, uint256 offset, uint256 limit)
    external
    view
    returns (uint256[] memory)
    {
        uint256[] storage allOrders = traderOrders[trader];

        if (offset >= allOrders.length) {
            return new uint256[](0);
        }

        uint256 end = offset + limit;
        if (end > allOrders.length) {
            end = allOrders.length;
        }

        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allOrders[i];
        }

        return result;
    }

    /**
     * @dev Calculate fee with checks for rounding edge cases
     */
    function calculateFee(uint256 _amount, uint256 _price) public view returns (uint256) {
        if (_amount == 0 || _price == 0) {
            return 0;
        }

        uint256 totalValue = (_amount * _price) / 1e18;
        return (totalValue * tradingFee) / 10000;
    }
}