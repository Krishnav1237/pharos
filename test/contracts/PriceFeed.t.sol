// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/utils/PriceFeed.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MockChainlinkOracle is AggregatorV3Interface {
    int256 private _answer;
    uint8 private _decimals;
    uint256 private _timestamp;
    bool private _shouldRevert;

    constructor(int256 initialAnswer, uint8 decimalsValue) {
        _answer = initialAnswer;
        _decimals = decimalsValue;
        _timestamp = block.timestamp;
        _shouldRevert = false;
    }

    function setAnswer(int256 answer) external {
        _answer = answer;
        _timestamp = block.timestamp;
    }

    function setDecimals(uint8 decimalsValue) external {
        _decimals = decimalsValue;
    }

    function setTimestamp(uint256 timestamp) external {
        _timestamp = timestamp;
    }

    function setShouldRevert(bool shouldRevert) external {
        _shouldRevert = shouldRevert;
    }

    function decimals() external view override returns (uint8) {
        if (_shouldRevert) revert("Oracle error");
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock Chainlink Oracle";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        if (_shouldRevert) revert("Oracle error");
        return (_roundId, _answer, _timestamp, _timestamp, _roundId);
    }

    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        if (_shouldRevert) revert("Oracle error");
        return (1, _answer, _timestamp, _timestamp, 1);
    }
}

contract PriceFeedTest is Test {
    PriceFeed public priceFeed;
    MockChainlinkOracle public primaryOracle;
    MockChainlinkOracle public secondaryOracle;

    address public admin = address(1);
    address public updater = address(2);
    address public emergency = address(3);
    address public user = address(4);

    address public mockAsset = address(0x1234);

    uint256 public constant INITIAL_PRICE = 1000 * 1e18; // $1000
    uint256 public constant DEFAULT_HEARTBEAT = 24 hours;

    function setUp() public {
        // Deploy mocked Chainlink oracles
        primaryOracle = new MockChainlinkOracle(int256(INITIAL_PRICE), 18);
        secondaryOracle = new MockChainlinkOracle(int256(INITIAL_PRICE * 102 / 100), 18); // 2% higher

        // Deploy PriceFeed contract
        vm.prank(admin);
        priceFeed = new PriceFeed();

        // Setup roles
        vm.startPrank(admin);
        priceFeed.grantRole(priceFeed.PRICE_UPDATER_ROLE(), updater);
        priceFeed.grantRole(priceFeed.EMERGENCY_ROLE(), emergency);
        vm.stopPrank();

        // Increase default deviation tolerance for tests
        vm.prank(admin);
        priceFeed.setDeviationTolerance(500); // Set to 5% to allow for our test cases
    }

    // ============ Tests for Admin Functions ============

    function testAddManualPriceFeed() public {
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        (uint256 price, uint256 timestamp, bool isStale) = priceFeed.getLatestPrice(mockAsset);

        assertEq(price, INITIAL_PRICE);
        assertEq(isStale, false);
        assertTrue(timestamp > 0);

        // Check feed count
        assertEq(priceFeed.getPriceFeedCount(), 1);
    }

    function test_RevertWhen_NonAdminAddsManualPriceFeed() public {
        vm.prank(user);
        vm.expectRevert();
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);
    }

    function testAddChainlinkPriceFeed() public {
        vm.prank(admin);
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(primaryOracle),
            address(0), // No secondary oracle
            DEFAULT_HEARTBEAT
        );

        (uint256 price, uint256 timestamp, bool isStale) = priceFeed.getLatestPrice(mockAsset);

        assertEq(price, INITIAL_PRICE);
        assertEq(isStale, false);
        assertTrue(timestamp > 0);

        // Check feed details
        (
            address asset,
            uint256 fetchedPrice,
            ,  // Unused timestamp
            PriceFeed.PriceSource source,
            address primaryOracleAddr,
            address secondaryOracleAddr,
            bool active,
            bool fetchedIsStale
        ) = priceFeed.getPriceFeedByIndex(0);

        assertEq(asset, mockAsset);
        assertEq(fetchedPrice, INITIAL_PRICE);
        assertEq(uint(source), uint(PriceFeed.PriceSource.CHAINLINK));
        assertEq(primaryOracleAddr, address(primaryOracle));
        assertEq(secondaryOracleAddr, address(0));
        assertTrue(active);
        assertFalse(fetchedIsStale);
    }

    function testAddChainlinkPriceFeedWithSecondary() public {
        vm.prank(admin);
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(primaryOracle),
            address(secondaryOracle),
            DEFAULT_HEARTBEAT
        );

        (
            ,
            ,
            ,
            PriceFeed.PriceSource source,
            ,
            address secondaryOracleAddr,
            ,

        ) = priceFeed.getPriceFeedByIndex(0);

        assertEq(uint(source), uint(PriceFeed.PriceSource.AGGREGATED));
        assertEq(secondaryOracleAddr, address(secondaryOracle));
    }

    function test_RevertWhen_AddInvalidOracle() public {
        vm.prank(admin);
        vm.expectRevert();
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(0), // Invalid oracle address
            address(0),
            DEFAULT_HEARTBEAT
        );
    }

    function testRemovePriceFeed() public {
        // Add a feed first
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        // Check feed count
        assertEq(priceFeed.getPriceFeedCount(), 1);

        // Remove the feed
        vm.prank(admin);
        priceFeed.removePriceFeed(mockAsset);

        // Check feed count is now 0
        assertEq(priceFeed.getPriceFeedCount(), 0);

        // Verify accessing the removed feed reverts
        vm.expectRevert();
        priceFeed.getLatestPrice(mockAsset);
    }

    // ============ Tests for Price Updates ============

    function testQueueAndExecuteManualPriceUpdate() public {
        // Add a manual price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        uint256 newPrice = INITIAL_PRICE * 104 / 100; // 4% increase, within tolerance

        // Queue price update
        vm.prank(updater);
        priceFeed.queueManualPriceUpdate(mockAsset, newPrice);

        // Check pending update details
        (
            bool exists,
            uint256 pendingPrice,
            ,
            uint256 timeUntilExecution,
            address pendingUpdater
        ) = priceFeed.getPendingPriceUpdate(mockAsset);

        assertTrue(exists);
        assertEq(pendingPrice, newPrice);
        assertEq(pendingUpdater, updater);
        assertTrue(timeUntilExecution > 0);

        // Advance time to execution delay
        vm.warp(block.timestamp + priceFeed.manualPriceUpdateDelay() + 1);

        // Execute the update
        vm.prank(updater);
        priceFeed.executeManualPriceUpdate(mockAsset);

        // Check new price
        (uint256 price, , ) = priceFeed.getLatestPrice(mockAsset);
        assertEq(price, newPrice);

        // Check pending update is cleared
        (exists, , , , ) = priceFeed.getPendingPriceUpdate(mockAsset);
        assertFalse(exists);
    }

    function test_RevertWhen_ExcessivePriceDeviation() public {
        // Add a manual price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        // Set a low deviation tolerance (1%)
        vm.prank(admin);
        priceFeed.setDeviationTolerance(100);

        // Try to queue a price with 5% increase (should revert)
        uint256 newPrice = INITIAL_PRICE * 105 / 100;

        vm.prank(updater);
        vm.expectRevert();
        priceFeed.queueManualPriceUpdate(mockAsset, newPrice);

        // Now try with a price within tolerance
        newPrice = INITIAL_PRICE * 101 / 100; // 1% increase

        vm.prank(updater);
        priceFeed.queueManualPriceUpdate(mockAsset, newPrice);
    }

    function testUpdateChainlinkPrice() public {
        // Add a Chainlink price feed
        vm.prank(admin);
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(primaryOracle),
            address(0),
            DEFAULT_HEARTBEAT
        );

        // Advance time a bit to ensure timestamp is newer
        vm.warp(block.timestamp + 15);

        // Update oracle price (this also updates the timestamp in our mock)
        uint256 newPrice = INITIAL_PRICE * 103 / 100; // 3% increase
        primaryOracle.setAnswer(int256(newPrice));

        // Update price in the contract
        vm.prank(updater);
        priceFeed.updateChainlinkPrice(mockAsset);

        // Check new price
        (uint256 price, , ) = priceFeed.getLatestPrice(mockAsset);
        assertEq(price, newPrice);
    }

    function testSecondaryOracleFailover() public {
        // Add a Chainlink price feed with secondary
        vm.prank(admin);
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(primaryOracle),
            address(secondaryOracle),
            DEFAULT_HEARTBEAT
        );

        // Advance time a bit to ensure timestamp is newer
        vm.warp(block.timestamp + 15);

        // Make primary oracle revert
        primaryOracle.setShouldRevert(true);

        // Secondary oracle has a different price
        uint256 secondaryPrice = INITIAL_PRICE * 102 / 100; // 2% higher
        secondaryOracle.setAnswer(int256(secondaryPrice));

        // Update price in the contract (should use secondary)
        vm.prank(updater);
        priceFeed.updateChainlinkPrice(mockAsset);

        // Check new price
        (uint256 price, , ) = priceFeed.getLatestPrice(mockAsset);
        assertEq(price, secondaryPrice);

        // Check that failover happened (no direct way to check, but price should match secondary)
        assertTrue(price == secondaryPrice);
    }

    function test_RevertWhen_BothOraclesFail() public {
        // Add a Chainlink price feed with secondary
        vm.prank(admin);
        priceFeed.addChainlinkPriceFeed(
            mockAsset,
            address(primaryOracle),
            address(secondaryOracle),
            DEFAULT_HEARTBEAT
        );

        // Make both oracles revert
        primaryOracle.setShouldRevert(true);
        secondaryOracle.setShouldRevert(true);

        // Try to update price (should revert)
        vm.prank(updater);
        vm.expectRevert();
        priceFeed.updateChainlinkPrice(mockAsset);
    }

    // ============ Tests for Price Staleness ============

    function testPriceStaleness() public {
        // Add a price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, 1 hours); // 1 hour heartbeat

        // Initially not stale
        (, , bool isStale) = priceFeed.getLatestPrice(mockAsset);
        assertFalse(isStale);

        // Advance time by just under heartbeat
        vm.warp(block.timestamp + 1 hours - 1);

        // Should still not be stale
        (, , isStale) = priceFeed.getLatestPrice(mockAsset);
        assertFalse(isStale);

        // Advance time past heartbeat
        vm.warp(block.timestamp + 2);

        // Should now be stale
        (, , isStale) = priceFeed.getLatestPrice(mockAsset);
        assertTrue(isStale);

        // Update the price
        vm.prank(updater);
        priceFeed.queueManualPriceUpdate(mockAsset, INITIAL_PRICE);

        // Fast-forward through delay
        vm.warp(block.timestamp + priceFeed.manualPriceUpdateDelay() + 1);

        vm.prank(updater);
        priceFeed.executeManualPriceUpdate(mockAsset);

        // Price should no longer be stale
        (, , isStale) = priceFeed.getLatestPrice(mockAsset);
        assertFalse(isStale);
    }

    // ============ Tests for Emergency Functions ============

    function testEmergencyPriceOverride() public {
        // Add a price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        uint256 emergencyPrice = INITIAL_PRICE * 70 / 100; // 30% drop

        // Try with non-emergency role (should fail)
        vm.prank(user);
        vm.expectRevert();
        priceFeed.emergencyPriceOverride(mockAsset, emergencyPrice);

        // Try with emergency role
        vm.prank(emergency);
        priceFeed.emergencyPriceOverride(mockAsset, emergencyPrice);

        // Check new price
        (uint256 price, , ) = priceFeed.getLatestPrice(mockAsset);
        assertEq(price, emergencyPrice);
    }

    function testSuspendAndResumeManualUpdates() public {
        // Add a price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        // Suspend manual updates
        vm.prank(emergency);
        priceFeed.setManualUpdatesSuspended(true);

        // Try to queue update (should fail)
        vm.prank(updater);
        vm.expectRevert("Manual updates suspended");
        priceFeed.queueManualPriceUpdate(mockAsset, INITIAL_PRICE * 104 / 100);

        // Resume manual updates
        vm.prank(emergency);
        priceFeed.setManualUpdatesSuspended(false);

        // Now update should work
        vm.prank(updater);
        priceFeed.queueManualPriceUpdate(mockAsset, INITIAL_PRICE * 104 / 100);
    }

    // ============ Tests for Configuration Functions ============

    function testSetDeviationTolerance() public {
        // Default should be 2%
        assertEq(priceFeed.deviationTolerance(), 500); // We set it to 5% in setUp

        // Set to 10%
        vm.prank(admin);
        priceFeed.setDeviationTolerance(1000);

        assertEq(priceFeed.deviationTolerance(), 1000);
    }

    function testSetDefaultHeartbeat() public {
        // Default is 24 hours
        assertEq(priceFeed.defaultHeartbeat(), 24 hours);

        // Change to 12 hours
        vm.prank(admin);
        priceFeed.setDefaultHeartbeat(12 hours);

        assertEq(priceFeed.defaultHeartbeat(), 12 hours);
    }

    function testSetManualPriceUpdateDelay() public {
        // Default is 30 minutes
        assertEq(priceFeed.manualPriceUpdateDelay(), 30 minutes);

        // Change to 1 hour
        vm.prank(admin);
        priceFeed.setManualPriceUpdateDelay(1 hours);

        assertEq(priceFeed.manualPriceUpdateDelay(), 1 hours);
    }

    function testActivateDeactivatePriceFeed() public {
        // Add a price feed
        vm.prank(admin);
        priceFeed.addManualPriceFeed(mockAsset, INITIAL_PRICE, DEFAULT_HEARTBEAT);

        // Should be active by default
        (,,,,,,bool active,) = priceFeed.getPriceFeedByIndex(0);
        assertTrue(active);

        // Deactivate it
        vm.prank(admin);
        priceFeed.setPriceFeedActive(mockAsset, false);

        // Should now be inactive
        (,,,,,,active,) = priceFeed.getPriceFeedByIndex(0);
        assertFalse(active);

        // Try to update (should fail)
        vm.prank(updater);
        vm.expectRevert("Price feed not active");
        priceFeed.queueManualPriceUpdate(mockAsset, INITIAL_PRICE);

        // Reactivate it
        vm.prank(admin);
        priceFeed.setPriceFeedActive(mockAsset, true);

        // Should now be active again
        (,,,,,,active,) = priceFeed.getPriceFeedByIndex(0);
        assertTrue(active);
    }
}