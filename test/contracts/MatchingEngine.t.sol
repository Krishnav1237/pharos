// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/exchange/MatchingEngine.sol";

contract MatchingEngineTest is Test {
    MatchingEngine public engine;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public matcher = address(4);

    bytes32 public constant MATCHER_ROLE = keccak256("MATCHER_ROLE");

    function setUp() public {
        vm.startPrank(owner);
        engine = new MatchingEngine(owner);
        engine.grantRole(MATCHER_ROLE, matcher);
        vm.stopPrank();
    }

    function testPlaceLimitOrder() public {
        vm.startPrank(user1);

        uint256 orderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            1e18,  // price
            10e18, // quantity
            MatchingEngine.OrderType.LIMIT
        );

        (
            uint256 id,
            address trader,
            MatchingEngine.OrderSide side,
            uint256 price,
            uint256 quantity,
            uint256 filled,
            MatchingEngine.OrderType orderType,
            uint256 timestamp
        ) = engine.orders(orderId);

        assertEq(id, 0);
        assertEq(trader, user1);
        assertEq(uint(side), uint(MatchingEngine.OrderSide.BUY));
        assertEq(price, 1e18);
        assertEq(quantity, 10e18);
        assertEq(filled, 0);
        assertEq(uint(orderType), uint(MatchingEngine.OrderType.LIMIT));
        assertEq(timestamp, block.timestamp);

        vm.stopPrank();
    }

    function testPlaceMarketOrder() public {
        vm.startPrank(user1);

        uint256 orderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            0,      // price not relevant for market orders
            10e18,  // quantity
            MatchingEngine.OrderType.MARKET
        );

        (,,, uint256 price,,, MatchingEngine.OrderType orderType,) = engine.orders(orderId);

        assertEq(price, 0);
        assertEq(uint(orderType), uint(MatchingEngine.OrderType.MARKET));

        vm.stopPrank();
    }

    function testInvalidOrders() public {
        vm.startPrank(user1);

        // Zero quantity
        vm.expectRevert("Quantity must be > 0");
        engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            1e18,
            0,
            MatchingEngine.OrderType.LIMIT
        );

        // Zero price for limit orderBook.ts
        vm.expectRevert("Price must be > 0");
        engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            0,
            10e18,
            MatchingEngine.OrderType.LIMIT
        );

        vm.stopPrank();
    }

    function testMatchOrders() public {
        // Create buy orderBook.ts
        vm.prank(user1);
        uint256 buyOrderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            2e18,  // price
            10e18, // quantity
            MatchingEngine.OrderType.LIMIT
        );

        // Create sell orderBook.ts
        vm.prank(user2);
        uint256 sellOrderId = engine.placeOrder(
            MatchingEngine.OrderSide.SELL,
            1e18,  // price
            5e18,  // quantity
            MatchingEngine.OrderType.LIMIT
        );

        // Match orders
        uint256[] memory buyOrderIds = new uint256[](1);
        uint256[] memory sellOrderIds = new uint256[](1);
        buyOrderIds[0] = buyOrderId;
        sellOrderIds[0] = sellOrderId;

        vm.prank(matcher);
        engine.matchOrders(buyOrderIds, sellOrderIds);

        // Verify matching results
        (,,,,, uint256 buyFilled,,) = engine.orders(buyOrderId);
        (,,,,, uint256 sellFilled,,) = engine.orders(sellOrderId);

        assertEq(buyFilled, 5e18);  // Partially filled
        assertEq(sellFilled, 5e18);  // Fully filled
    }

    function testNoMatchOnIncompatiblePrice() public {
        // Buy orderBook.ts with lower price
        vm.prank(user1);
        uint256 buyOrderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            1e18,  // price
            10e18, // quantity
            MatchingEngine.OrderType.LIMIT
        );

        // Sell orderBook.ts with higher price
        vm.prank(user2);
        uint256 sellOrderId = engine.placeOrder(
            MatchingEngine.OrderSide.SELL,
            2e18,  // price
            5e18,  // quantity
            MatchingEngine.OrderType.LIMIT
        );

        // Try to match orders
        uint256[] memory buyOrderIds = new uint256[](1);
        uint256[] memory sellOrderIds = new uint256[](1);
        buyOrderIds[0] = buyOrderId;
        sellOrderIds[0] = sellOrderId;

        vm.prank(matcher);
        engine.matchOrders(buyOrderIds, sellOrderIds);

        // Verify no matching occurred
        (,,,,, uint256 buyFilled,,) = engine.orders(buyOrderId);
        (,,,,, uint256 sellFilled,,) = engine.orders(sellOrderId);

        assertEq(buyFilled, 0);
        assertEq(sellFilled, 0);
    }

    function testCancelOrder() public {
        vm.startPrank(user1);
        uint256 orderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            1e18,
            10e18,
            MatchingEngine.OrderType.LIMIT
        );

        engine.cancelOrder(orderId);

        // Verify orderBook.ts is deleted
        (, address trader, , , , , , ) = engine.orders(orderId);        assertEq(trader, address(0));
        vm.stopPrank();
    }

    function testCancelOtherUserOrder() public {
        // User1 creates orderBook.ts
        vm.prank(user1);
        uint256 orderId = engine.placeOrder(
            MatchingEngine.OrderSide.BUY,
            1e18,
            10e18,
            MatchingEngine.OrderType.LIMIT
        );

        // User2 tries to cancel it
        vm.prank(user2);
        vm.expectRevert("Not your order");
        engine.cancelOrder(orderId);
    }

    function testSetSlippageTolerance() public {
        vm.prank(owner);
        engine.setSlippageTolerance(300); // 3%
        assertEq(engine.slippageTolerance(), 300);
    }

    function testAccessControl() public {
        // Non-admin tries to set slippage
        vm.prank(user1);
        vm.expectRevert();
        engine.setSlippageTolerance(300);

        // Non-matcher tries to match orders
        uint256[] memory emptyArray = new uint256[](0);
        vm.prank(user1);
        vm.expectRevert();
        engine.matchOrders(emptyArray, emptyArray);
    }
}