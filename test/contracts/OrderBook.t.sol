// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/exchange/OrderBook.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock token for testing
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OrderBookTest is Test {
    OrderBook public orderBook;
    address public owner;
    address public feeCollector;
    address public matchingEngine;
    address public trader1;
    address public trader2;

    MockToken public tokenAsset;
    MockToken public paymentAsset;
    bytes32 public pairKey;

    uint256 public constant INITIAL_BALANCE = 10000 * 10**18;

    function setUp() public {
        // Setup accounts
        owner = address(this);
        feeCollector = makeAddr("feeCollector");
        matchingEngine = makeAddr("matchingEngine");
        trader1 = makeAddr("trader1");
        trader2 = makeAddr("trader2");

        // Deploy tokens
        tokenAsset = new MockToken("Test Token", "TKN");
        paymentAsset = new MockToken("Test Payment", "PAY");

        // Deploy OrderBook
        orderBook = new OrderBook(owner, feeCollector);
        orderBook.setMatchingEngine(matchingEngine);

        // Setup pair
        pairKey = keccak256(abi.encodePacked(address(tokenAsset), address(paymentAsset)));
        orderBook.addAssetPair(address(tokenAsset), address(paymentAsset), true, 10**16); // 0.01 min price increment

        // Distribute tokens to traders
        tokenAsset.transfer(trader1, INITIAL_BALANCE);
        tokenAsset.transfer(trader2, INITIAL_BALANCE);
        paymentAsset.transfer(trader1, INITIAL_BALANCE);
        paymentAsset.transfer(trader2, INITIAL_BALANCE);

        // Approve exchange for traders
        vm.startPrank(trader1);
        tokenAsset.approve(address(orderBook), INITIAL_BALANCE);
        paymentAsset.approve(address(orderBook), INITIAL_BALANCE);
        vm.stopPrank();

        vm.startPrank(trader2);
        tokenAsset.approve(address(orderBook), INITIAL_BALANCE);
        paymentAsset.approve(address(orderBook), INITIAL_BALANCE);
        vm.stopPrank();
    }

    // ============ Admin Function Tests ============

    function testInitialState() public {
        assertEq(orderBook.owner(), owner);
        assertEq(orderBook.feeCollector(), feeCollector);
        assertEq(orderBook.matchingEngine(), matchingEngine);
        assertEq(orderBook.tradingFee(), 25);
        assertEq(orderBook.nextOrderId(), 1);
    }

    function testSetMatchingEngine() public {
        address newEngine = makeAddr("newEngine");
        orderBook.setMatchingEngine(newEngine);
        assertEq(orderBook.matchingEngine(), newEngine);
    }

    function testSetMatchingEngineRevertOnZeroAddress() public {
        vm.expectRevert("Invalid address");
        orderBook.setMatchingEngine(address(0));
    }

    function testSetTradingFee() public {
        orderBook.setTradingFee(30);
        assertEq(orderBook.tradingFee(), 30);
    }

    function testSetTradingFeeRevertOnHighFee() public {
        vm.expectRevert("Fee too high");
        orderBook.setTradingFee(101);
    }

    function testSetFeeCollector() public {
        address newCollector = makeAddr("newCollector");
        orderBook.setFeeCollector(newCollector);
        assertEq(orderBook.feeCollector(), newCollector);
    }

    function testPauseAndUnpause() public {
        orderBook.pause();
        assertTrue(orderBook.paused());

        orderBook.unpause();
        assertFalse(orderBook.paused());
    }

    function testAddAssetPair() public {
        MockToken newToken = new MockToken("New Token", "NEW");
        MockToken newPayment = new MockToken("New Payment", "NPAY");

        orderBook.addAssetPair(
            address(newToken),
            address(newPayment),
            true,
            10**16
        );

        bytes32 newPairKey = keccak256(abi.encodePacked(address(newToken), address(newPayment)));
        (address token, address payment, bool isActive, uint256 minPriceIncrement) = orderBook.assetPairs(newPairKey);

        assertEq(token, address(newToken));
        assertEq(payment, address(newPayment));
        assertTrue(isActive);
        assertEq(minPriceIncrement, 10**16);
    }

    function testSetAssetPairStatus() public {
        orderBook.setAssetPairStatus(pairKey, false);
        (,, bool isActive,) = orderBook.assetPairs(pairKey);
        assertFalse(isActive);

        orderBook.setAssetPairStatus(pairKey, true);
        (,, isActive,) = orderBook.assetPairs(pairKey);
        assertTrue(isActive);
    }

    // ============ Order Management Tests ============

    function testCreateOrder() public {
        vm.startPrank(trader1);

        uint256 amount = 100 * 10**18;
        uint256 price = 2 * 10**18; // 2 payment tokens per token

        uint256 orderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            amount,
            price,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        vm.stopPrank();

        assertEq(orderId, 1);

        (
            uint256 id,
            address trader,
            address tokenAddr,
            address paymentAddr,
            uint256 orderAmount,
            uint256 orderPrice,
            uint256 filled,
            ,
            ,
            OrderBook.OrderType orderType,
            OrderBook.OrderSide side,
            OrderBook.OrderStatus status
        ) = orderBook.orders(orderId);

        assertEq(id, 1);
        assertEq(trader, trader1);
        assertEq(tokenAddr, address(tokenAsset));
        assertEq(paymentAddr, address(paymentAsset));
        assertEq(orderAmount, amount);
        assertEq(orderPrice, price);
        assertEq(filled, 0);
        assertEq(uint8(orderType), uint8(OrderBook.OrderType.LIMIT));
        assertEq(uint8(side), uint8(OrderBook.OrderSide.SELL));
        assertEq(uint8(status), uint8(OrderBook.OrderStatus.OPEN));
    }

    function testCreateOrderWithExpiry() public {
        vm.startPrank(trader1);

        uint256 amount = 100 * 10**18;
        uint256 price = 2 * 10**18;
        uint256 expiry = 1 days;

        uint256 orderId = orderBook.createOrderWithExpiry(
            address(tokenAsset),
            address(paymentAsset),
            amount,
            price,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL,
            expiry
        );

        vm.stopPrank();

        (,,,,,,, uint256 timestamp, uint256 expiryTime,,,) = orderBook.orders(orderId);

        assertEq(expiryTime, timestamp + expiry);
    }

    function testCancelOrder() public {
        // Owner sets a 1% cancellation fee
        orderBook.setTradingFee(100);  // 100 bp = 1%

        vm.startPrank(trader1);

        // Record initial token balance
        uint256 tokenBalanceBefore = tokenAsset.balanceOf(trader1);

        // Place a 100-token SELL limit order
        uint256 oid = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 1e18,
            2 * 1e18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        // Cancel the order
        orderBook.cancelOrder(oid);

        // Check token balance after cancel
        uint256 tokenBalanceAfterCancel = tokenAsset.balanceOf(trader1);

        // Fee = 1% of 100 = 1 token (1 * 10**18)
        uint256 fee = (100 * 1e18 * 100) / 10_000; // = 1e18

        assertEq(
            tokenBalanceAfterCancel,
            tokenBalanceBefore - fee,
            "should refund minus 1%"
        );

        vm.stopPrank();
    }

    function testCancelBuyOrder() public {
        // Owner sets a 1% cancellation fee
        orderBook.setTradingFee(100);  // 100 bp = 1%

        vm.startPrank(trader1);

        // Record initial payment balance
        uint256 paymentBalanceBefore = paymentAsset.balanceOf(trader1);

        // Place a 50-token BUY limit order @ price = 3
        uint256 amount       = 50 * 1e18;
        uint256 price        = 3 * 1e18;
        uint256 totalPayment = (amount * price) / 1e18; // = 150 * 10**18

        uint256 oid = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            amount,
            price,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        // Cancel the order
        orderBook.cancelOrder(oid);

        // Check payment balance after cancel
        uint256 paymentBalanceAfterCancel = paymentAsset.balanceOf(trader1);

        // Fee = 1% of totalPayment = 1.5 tokens → truncated to 1e18
        uint256 fee = (totalPayment * 100) / 10_000;   // = 1e18

        assertEq(
            paymentBalanceAfterCancel,
            paymentBalanceBefore - fee,
            "should refund minus 1%"
        );

        vm.stopPrank();
    }

    function testCancelOrderFailsForNonOwner() public {
        vm.prank(trader1);
        uint256 orderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        vm.expectRevert("Not order owner");
        vm.prank(trader2);
        orderBook.cancelOrder(orderId);
    }

    function testCleanupExpiredOrders() public {
        vm.prank(trader1);
        uint256 orderId = orderBook.createOrderWithExpiry(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL,
            1 days
        );

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 days);

        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        orderBook.cleanupExpiredOrders(orderIds);

        (,,,,,,,,,,, OrderBook.OrderStatus status) = orderBook.orders(orderId);
        assertEq(uint8(status), uint8(OrderBook.OrderStatus.EXPIRED));
    }

    function testUpdateOrderAfterMatch() public {
        // Create an order
        vm.prank(trader1);
        uint256 orderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18, // Order amount
            2 * 10**18,   // Price
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        // Verify initial state: filled == 0, status == OPEN
        (, , , , , , uint256 filledBefore, , , , , OrderBook.OrderStatus statusBefore)
        = orderBook.orders(orderId);
        assertEq(filledBefore, 0, "Initial filled should be 0");
        assertEq(
            uint8(statusBefore),
            uint8(OrderBook.OrderStatus.OPEN),
            "Initial status should be OPEN"
        );

        // Simulate a match of 2 ether worth of the order
        vm.prank(matchingEngine);
        orderBook.updateOrderAfterMatch(orderId, 2 * 10**18);

        // Get the updated order state
        (, , , , , , uint256 filledAfter, , , , , OrderBook.OrderStatus statusAfter)
        = orderBook.orders(orderId);

        // Check that the filled amount is now 2 ether
        assertEq(filledAfter, 2 * 10**18, "Filled amount not updated correctly");

        // Check that status is now PARTIAL_FILLED
        assertEq(
            uint8(statusAfter),
            uint8(OrderBook.OrderStatus.PARTIAL_FILLED),
            "Status not updated correctly"
        );
    }

    function testUpdateOrderAfterMatchFailsForNonMatchingEngine() public {
        vm.prank(trader1);
        uint256 orderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        vm.expectRevert("Not matching engine");
        vm.prank(trader2);
        orderBook.updateOrderAfterMatch(orderId, 50 * 10**18);
    }

    // ============ View Function Tests ============

    function testGetBestPrices() public {
        // Create buy order
        vm.prank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            1.9 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        // Create another buy order with better price
        vm.prank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        // Create sell order
        vm.prank(trader2);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2.1 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        // Create another sell order with better price
        vm.prank(trader2);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2.05 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );

        (uint256 bestBuyPrice, uint256 bestSellPrice) = orderBook.getBestPrices(address(tokenAsset), address(paymentAsset));

        assertEq(bestBuyPrice, 2 * 10**18); // Best buy price (highest)
        assertEq(bestSellPrice, 2.05 * 10**18); // Best sell price (lowest)
    }

    function testGetTraderOrders() public {
        // Create multiple orders for trader1
        vm.startPrank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            50 * 10**18,
            2.1 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            75 * 10**18,
            2.2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );
        vm.stopPrank();

        uint256[] memory orders = orderBook.getTraderOrders(trader1, 0, 10);
        assertEq(orders.length, 3);
        assertEq(orders[0], 1);
        assertEq(orders[1], 2);
        assertEq(orders[2], 3);

        // Test pagination
        orders = orderBook.getTraderOrders(trader1, 1, 1);
        assertEq(orders.length, 1);
        assertEq(orders[0], 2);
    }

    function testCalculateFee() public {
        uint256 amount = 100 * 10**18;
        uint256 price = 2 * 10**18;

        uint256 fee = orderBook.calculateFee(amount, price);

        // Expected: (100 * 10^18 * 2 * 10^18) / 10^18 * 25 / 10000 = 5 * 10^17
        assertEq(fee, 5 * 10**17);
    }

    // ============ Integrated Tests ============

    function testOrderBookOptimization() public {
        vm.prank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        vm.prank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            1.9 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        vm.prank(trader1);
        orderBook.cancelOrder(1); // Cancel the 2.0 order

        (uint256 bestBuyPrice,) = orderBook.getBestPrices(address(tokenAsset), address(paymentAsset));
        assertEq(bestBuyPrice, 1.9 * 10**18); // Ensure best price updates
    }

    function testMarketOrderFlow() public {
        // Create a limit sell order from trader2
        vm.startPrank(trader2);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            50 * 10**18,  // 50 tokens
            2 * 10**18,   // price of 2 payment tokens per token
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.SELL
        );
        vm.stopPrank();
        
        // Create a market buy order from trader1
        vm.startPrank(trader1);
        uint256 marketOrderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            50 * 10**18,  // trying to buy 50 tokens
            50 * 10**18,  // This price is ignored for market orders
            OrderBook.OrderType.MARKET,
            OrderBook.OrderSide.BUY
        );
        vm.stopPrank();
        
        // Check that the price and amount were set correctly for the BUY market order
        (,,,, uint256 orderAmount, uint256 price,,,,,,) = orderBook.orders(marketOrderId);
        
        assertEq(orderAmount, 50 * 10**18, "Order amount should be 50 tokens");
        
        // For BUY market orders, the price should be set to the maximum uint256 value
        // This matches the _createOrderInternal implementation in OrderBook.sol
        uint256 expectedPrice = type(uint256).max; // <-- Ensure this line is present
        assertEq(price, expectedPrice, "Market BUY order price should be max uint256"); // <-- Ensure this assertion compares 'price' and 'expectedPrice'
    }

    function testPausedExchange() public {
        // Pause the exchange
        orderBook.pause();

        // Try to create an order while paused - don't specify exact error message
        vm.expectRevert();
        vm.prank(trader1);
        orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        // Unpause and verify it works again
        orderBook.unpause();

        vm.prank(trader1);
        uint256 orderId = orderBook.createOrder(
            address(tokenAsset),
            address(paymentAsset),
            100 * 10**18,
            2 * 10**18,
            OrderBook.OrderType.LIMIT,
            OrderBook.OrderSide.BUY
        );

        assertEq(orderId, 1);
    }
}