// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/registry/AssetRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Import the actual tokens but rename them to avoid conflict with interfaces
import {StockToken as StockTokenImpl} from "../../src/tokens/StockToken.sol";
import {CommodityToken as CommodityTokenImpl} from "../../src/tokens/CommodityToken.sol";

contract AssetRegistryTest is Test {
    AssetRegistry public registry;

    address public owner = address(1);
    address public assetManager = address(2);
    address public user = address(3);

    StockTokenImpl public stockToken;
    CommodityTokenImpl public commodityToken;
    ERC20 public paymentToken;

    // Events to check
    event AssetRegistered(
        address indexed assetAddress,
        string name,
        string symbol,
        AssetRegistry.AssetType assetType
    );
    event AssetStatusChanged(address indexed assetAddress, bool isActive);

    function setUp() public {
        // Deploy the AssetRegistry
        vm.startPrank(owner);
        registry = new AssetRegistry(owner);

        // Grant asset manager role
        registry.grantRole(registry.ASSET_MANAGER_ROLE(), assetManager);

        // Deploy some tokens for testing
        stockToken = new StockTokenImpl(
            "Apple Inc.",
            "AAPL",
            "Apple Inc.",
            "AAPL",
            "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
            10000 * 1e18,
            owner
        );

        commodityToken = new CommodityTokenImpl(
            "Gold Token",
            "GOLD",
            "Gold Bullion",
            "XAU",
            "Tokenized representation of 1 troy ounce of 99.99% pure gold",
            "Precious Metals",
            1e18,
            10000 * 1e18,
            owner
        );

        // Use ERC20 for payment token simulation
        paymentToken = new MockPaymentToken("USD Coin", "USDC");

        vm.stopPrank();
    }

    // ============ Role Tests ============

    function testInitialRoles() public view {
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(registry.hasRole(registry.ASSET_MANAGER_ROLE(), owner));
        assertTrue(registry.hasRole(registry.ASSET_MANAGER_ROLE(), assetManager));
        assertFalse(registry.hasRole(registry.ASSET_MANAGER_ROLE(), user));
    }

    function testGrantAssetManagerRole() public {
        // Make sure we're using the correct role
        bytes32 role = registry.ASSET_MANAGER_ROLE();

        vm.startPrank(owner);
        registry.grantRole(role, user);
        vm.stopPrank();

        assertTrue(registry.hasRole(role, user));
    }

    // ============ Registration Tests ============

    function testRegisterStockToken() public {
        vm.prank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        (string memory name, string memory symbol, AssetRegistry.AssetType assetType, bool isActive, ) =
                            registry.getAsset(address(stockToken));

        assertEq(name, "Apple Inc.");
        assertEq(symbol, "AAPL");
        assertEq(uint(assetType), uint(AssetRegistry.AssetType.STOCK));
        assertTrue(isActive);
    }

    function testRegisterCommodityToken() public {
        vm.prank(assetManager);
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);

        (string memory name, string memory symbol, AssetRegistry.AssetType assetType, bool isActive, ) =
                            registry.getAsset(address(commodityToken));

        assertEq(name, "Gold Token");
        assertEq(symbol, "GOLD");
        assertEq(uint(assetType), uint(AssetRegistry.AssetType.COMMODITY));
        assertTrue(isActive);
    }

    function testRegisterPaymentToken() public {
        vm.prank(assetManager);
        registry.registerPaymentToken(address(paymentToken), "USD Coin", "USDC", true);

        (string memory name, string memory symbol, AssetRegistry.AssetType assetType, bool isActive, ) =
                            registry.getAsset(address(paymentToken));

        assertEq(name, "USD Coin");
        assertEq(symbol, "USDC");
        assertEq(uint(assetType), uint(AssetRegistry.AssetType.PAYMENT));
        assertTrue(isActive);
    }

    function testRegisterAssetFailsForNonAssetManager() public {
        vm.prank(user);
        vm.expectRevert();
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
    }

    function testCannotRegisterSameAssetTwice() public {
        vm.startPrank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        vm.expectRevert("Already registered");
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        vm.stopPrank();
    }

    function testCannotRegisterZeroAddress() public {
        vm.prank(assetManager);
        vm.expectRevert("Invalid address");
        registry.registerAsset(address(0), AssetRegistry.AssetType.STOCK, true);
    }

    function testCannotRegisterPaymentTokenWithRegisterAsset() public {
        vm.prank(assetManager);
        vm.expectRevert("Use registerPaymentToken for payment assets");
        registry.registerAsset(address(paymentToken), AssetRegistry.AssetType.PAYMENT, true);
    }

    // ============ Status Update Tests ============

    function testSetAssetStatus() public {
        vm.startPrank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        registry.setAssetStatus(address(stockToken), false);
        vm.stopPrank();

        (,,,bool isActive,) = registry.getAsset(address(stockToken));
        assertFalse(isActive);
    }

    function testSetAssetStatusFailsForNonAssetManager() public {
        vm.prank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        vm.prank(user);
        vm.expectRevert();
        registry.setAssetStatus(address(stockToken), false);
    }

    function testSetAssetStatusFailsForNonRegisteredAsset() public {
        vm.prank(assetManager);
        vm.expectRevert("Asset not registered");
        registry.setAssetStatus(address(stockToken), false);
    }

    // ============ Query Tests ============

    function testGetAssetCount() public {
        vm.startPrank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);
        registry.registerPaymentToken(address(paymentToken), "USD Coin", "USDC", true);
        vm.stopPrank();

        assertEq(registry.getAssetCount(), 3);
    }

    function testGetAssetByIndex() public {
        vm.startPrank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);
        vm.stopPrank();

        (address assetAddress, string memory name, string memory symbol, AssetRegistry.AssetType assetType, bool isActive) =
                            registry.getAssetByIndex(1);

        assertEq(assetAddress, address(commodityToken));
        assertEq(name, "Gold Token");
        assertEq(symbol, "GOLD");
        assertEq(uint(assetType), uint(AssetRegistry.AssetType.COMMODITY));
        assertTrue(isActive);
    }

    function testGetAssetByIndexOutOfBounds() public {
        vm.prank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        vm.expectRevert("Index out of bounds");
        registry.getAssetByIndex(1);
    }

    function testGetActiveAssetsByType() public {
        vm.startPrank(assetManager);
        // Register 2 stock tokens, 1 active and 1 inactive
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        StockTokenImpl inactiveStock = new StockTokenImpl(
            "Tesla Inc.",
            "TSLA",
            "Tesla Inc.",
            "TSLA",
            "Tesla, Inc. designs, develops, manufactures, and sells electric vehicles and energy storage products.",
            10000 * 1e18,
            owner
        );
        registry.registerAsset(address(inactiveStock), AssetRegistry.AssetType.STOCK, false);

        // Register 1 commodity token
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);

        // Register 1 payment token
        registry.registerPaymentToken(address(paymentToken), "USD Coin", "USDC", true);
        vm.stopPrank();

        // Check active stocks
        address[] memory activeStocks = registry.getActiveAssetsByType(AssetRegistry.AssetType.STOCK);
        assertEq(activeStocks.length, 1);
        assertEq(activeStocks[0], address(stockToken));

        // Check active commodities
        address[] memory activeCommodities = registry.getActiveAssetsByType(AssetRegistry.AssetType.COMMODITY);
        assertEq(activeCommodities.length, 1);
        assertEq(activeCommodities[0], address(commodityToken));

        // Check active payment tokens
        address[] memory activePayments = registry.getActiveAssetsByType(AssetRegistry.AssetType.PAYMENT);
        assertEq(activePayments.length, 1);
        assertEq(activePayments[0], address(paymentToken));
    }

    // ============ Integration Tests ============

    function testFullLifecycle() public {
        // 1. Register multiple assets
        vm.startPrank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);
        registry.registerPaymentToken(address(paymentToken), "USD Coin", "USDC", true);

        // 2. Deactivate one of them
        registry.setAssetStatus(address(stockToken), false);

        // 3. Check counts by type
        address[] memory activeStocks = registry.getActiveAssetsByType(AssetRegistry.AssetType.STOCK);
        assertEq(activeStocks.length, 0);

        address[] memory activeCommodities = registry.getActiveAssetsByType(AssetRegistry.AssetType.COMMODITY);
        assertEq(activeCommodities.length, 1);
        assertEq(activeCommodities[0], address(commodityToken));

        // 4. Reactivate the deactivated asset
        registry.setAssetStatus(address(stockToken), true);
        vm.stopPrank();

        // 5. Check counts again
        activeStocks = registry.getActiveAssetsByType(AssetRegistry.AssetType.STOCK);
        assertEq(activeStocks.length, 1);
        assertEq(activeStocks[0], address(stockToken));

        // 6. Verify total count
        assertEq(registry.getAssetCount(), 3);
    }

    function testAssetRegistryBidirectionalIntegration() public {
        // 1. Register assets
        vm.prank(assetManager);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        // 2. Link asset to registry
        vm.prank(owner);
        stockToken.setAssetRegistry(address(registry));

        // 3. Verify the link
        assertEq(stockToken.assetRegistry(), address(registry));
    }

    function testDifferentAssetTypesWorkCorrectly() public {
        vm.startPrank(assetManager);

        // Register different asset types
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);

        // Register multiple payment tokens
        MockPaymentToken usdt = new MockPaymentToken("Tether", "USDT");
        MockPaymentToken dai = new MockPaymentToken("Dai", "DAI");

        registry.registerPaymentToken(address(paymentToken), "USD Coin", "USDC", true);
        registry.registerPaymentToken(address(usdt), "Tether", "USDT", true);
        registry.registerPaymentToken(address(dai), "Dai", "DAI", false); // Inactive

        vm.stopPrank();

        // Verify stock count
        address[] memory stocks = registry.getActiveAssetsByType(AssetRegistry.AssetType.STOCK);
        assertEq(stocks.length, 1);

        // Verify commodity count
        address[] memory commodities = registry.getActiveAssetsByType(AssetRegistry.AssetType.COMMODITY);
        assertEq(commodities.length, 1);

        // Verify active payment tokens count
        address[] memory payments = registry.getActiveAssetsByType(AssetRegistry.AssetType.PAYMENT);
        assertEq(payments.length, 2); // USDC and USDT are active, DAI is inactive

        // Check total count includes inactive assets
        assertEq(registry.getAssetCount(), 5);
    }

    function testRoleRevoking() public {
        bytes32 role = registry.ASSET_MANAGER_ROLE();

        // Grant role
        vm.prank(owner);
        registry.grantRole(role, user);

        // Verify user has role
        assertTrue(registry.hasRole(role, user));

        // Register asset as user
        vm.prank(user);
        registry.registerAsset(address(stockToken), AssetRegistry.AssetType.STOCK, true);

        // Revoke role
        vm.prank(owner);
        registry.revokeRole(role, user);

        // Verify role is revoked
        assertFalse(registry.hasRole(role, user));

        // Attempt to register another asset should fail
        vm.prank(user);
        vm.expectRevert();
        registry.registerAsset(address(commodityToken), AssetRegistry.AssetType.COMMODITY, true);
    }
}

// Mock payment token for testing
contract MockPaymentToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}