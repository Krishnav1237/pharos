// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/tokens/CommodityToken.sol";

contract CommodityTokenTest is Test {
    CommodityToken public token;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public assetRegistry = address(4);

    // Token parameters
    string constant TOKEN_NAME = "Gold Token";
    string constant TOKEN_SYMBOL = "GOLD";
    string constant COMMODITY_NAME = "Gold Bullion";
    string constant COMMODITY_SYMBOL = "XAU";
    string constant COMMODITY_DESCRIPTION = "Tokenized representation of 1 troy ounce of 99.99% pure gold";
    string constant COMMODITY_CATEGORY = "Precious Metals";
    uint256 constant STANDARD_UNIT = 1e18; // 1 token = 1 troy ounce with 18 decimals
    uint256 constant MAX_SUPPLY = 10000 * 1e18; // 10,000 oz

    // Events
    event CommodityMetadataUpdated(string commodityName, string commoditySymbol, string commodityDescription);
    event CommodityCategoryUpdated(string commodityCategory);
    event StandardUnitUpdated(uint256 standardUnit);
    event TradingStatusChanged(bool isTradable);
    event RegistryUpdated(address newRegistry);

    function setUp() public {
        vm.startPrank(owner);
        token = new CommodityToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            COMMODITY_NAME,
            COMMODITY_SYMBOL,
            COMMODITY_DESCRIPTION,
            COMMODITY_CATEGORY,
            STANDARD_UNIT,
            MAX_SUPPLY,
            owner
        );
        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function testInitialState() public {
        // ERC20 attributes
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.decimals(), 18);

        // Commodity attributes
        assertEq(token.commodityName(), COMMODITY_NAME);
        assertEq(token.commoditySymbol(), COMMODITY_SYMBOL);
        assertEq(token.commodityDescription(), COMMODITY_DESCRIPTION);
        assertEq(token.commodityCategory(), COMMODITY_CATEGORY);
        assertEq(token.standardUnit(), STANDARD_UNIT);
        assertEq(token.maxSupply(), MAX_SUPPLY);

        // Other states
        assertEq(token.isTradable(), false);
        assertEq(token.assetRegistry(), address(0));
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), owner);
    }

    // ============ Minting Tests ============

    function testMint() public {
        uint256 mintAmount = 100 * 1e18;

        vm.prank(owner);
        token.mint(user1, mintAmount);

        assertEq(token.totalSupply(), mintAmount);
        assertEq(token.balanceOf(user1), mintAmount);
    }

    function testMintFailsWhenExceedingMaxSupply() public {
        uint256 exceedingAmount = MAX_SUPPLY + 1;

        vm.startPrank(owner);
        vm.expectRevert("CommodityToken: Would exceed max supply");
        token.mint(user1, exceedingAmount);
        vm.stopPrank();
    }

    function testMintMultipleTimes() public {
        uint256 firstMint = 100 * 1e18;
        uint256 secondMint = 200 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, firstMint);
        token.mint(user2, secondMint);
        vm.stopPrank();

        assertEq(token.totalSupply(), firstMint + secondMint);
        assertEq(token.balanceOf(user1), firstMint);
        assertEq(token.balanceOf(user2), secondMint);
    }

    function testMintFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, 100 * 1e18);
    }

    // ============ Burning Tests ============

    function testBurn() public {
        uint256 mintAmount = 100 * 1e18;
        uint256 burnAmount = 50 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, mintAmount);
        vm.stopPrank();

        vm.prank(user1);
        token.burn(burnAmount);

        assertEq(token.totalSupply(), mintAmount - burnAmount);
        assertEq(token.balanceOf(user1), mintAmount - burnAmount);
    }

    function testBurnFrom() public {
        uint256 mintAmount = 100 * 1e18;
        uint256 burnAmount = 50 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, mintAmount);
        vm.stopPrank();

        vm.prank(user1);
        token.approve(user2, burnAmount);

        vm.prank(user2);
        token.burnFrom(user1, burnAmount);

        assertEq(token.totalSupply(), mintAmount - burnAmount);
        assertEq(token.balanceOf(user1), mintAmount - burnAmount);
    }

    // ============ Metadata Update Tests ============

    function testUpdateMetadata() public {
        string memory newName = "Silver Bullion";
        string memory newSymbol = "XAG";
        string memory newDescription = "Tokenized silver";

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit CommodityMetadataUpdated(newName, newSymbol, newDescription);
        token.updateMetadata(newName, newSymbol, newDescription);

        assertEq(token.commodityName(), newName);
        assertEq(token.commoditySymbol(), newSymbol);
        assertEq(token.commodityDescription(), newDescription);
    }

    function testUpdateMetadataFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.updateMetadata("New Name", "NEW", "New Description");
    }

    function testUpdateCategory() public {
        string memory newCategory = "Industrial Metals";

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit CommodityCategoryUpdated(newCategory);
        token.updateCategory(newCategory);

        assertEq(token.commodityCategory(), newCategory);
    }

    function testUpdateCategoryFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.updateCategory("New Category");
    }

    function testUpdateStandardUnit() public {
        uint256 newUnit = 2e18;

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit StandardUnitUpdated(newUnit);
        token.updateStandardUnit(newUnit);

        assertEq(token.standardUnit(), newUnit);
    }

    function testUpdateStandardUnitFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.updateStandardUnit(2e18);
    }

    // ============ Trading Tests ============

    function testSetTradable() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit TradingStatusChanged(true);
        token.setTradable(true);

        assertTrue(token.isTradable());

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit TradingStatusChanged(false);
        token.setTradable(false);

        assertFalse(token.isTradable());
    }

    function testSetTradableFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setTradable(true);
    }

    // ============ Registry Tests ============

    function testSetAssetRegistry() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit RegistryUpdated(assetRegistry);
        token.setAssetRegistry(assetRegistry);

        assertEq(token.assetRegistry(), assetRegistry);
    }

    function testSetAssetRegistryFailsWithZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("CommodityToken: Invalid registry address");
        token.setAssetRegistry(address(0));
    }

    function testSetAssetRegistryFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setAssetRegistry(assetRegistry);
    }

    // ============ Transfer Tests ============

    function testTransferWithTradingEnabled() public {
        uint256 amount = 100 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, amount);
        token.setTradable(true);
        vm.stopPrank();

        vm.prank(user1);
        token.transfer(user2, amount);

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), amount);
    }

    function testTransferWithTradingDisabledFailsForNonOwner() public {
        uint256 amount = 100 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, amount);
        // Trading is disabled by default
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert("CommodityToken: Trading is not enabled");
        token.transfer(user2, amount);
    }

    function testTransferFromWithTradingDisabledWorksForOwner() public {
        uint256 amount = 100 * 1e18;

        // Mint tokens to user1
        vm.prank(owner);
        token.mint(user1, amount);

        // User1 approves owner
        vm.prank(user1);
        token.approve(owner, amount);

        // Owner transfers from user1 to user2
        vm.prank(owner);
        token.transferFrom(user1, user2, amount);

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), amount);
    }

    function testTransferFromWithTradingEnabled() public {
        uint256 amount = 100 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, amount);
        token.setTradable(true);
        vm.stopPrank();

        vm.prank(user1);
        token.approve(user2, amount);

        vm.prank(user2);
        token.transferFrom(user1, user2, amount);

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), amount);
    }

    function testTransferFromWithTradingDisabledFailsForNonOwner() public {
        uint256 amount = 100 * 1e18;

        vm.startPrank(owner);
        token.mint(user1, amount);
        // Trading is disabled by default
        vm.stopPrank();

        vm.prank(user1);
        token.approve(user2, amount);

        vm.prank(user2);
        vm.expectRevert("CommodityToken: Trading is not enabled");
        token.transferFrom(user1, user2, amount);
    }

    // ============ Integration Tests ============

    function testFullLifecycle() public {
        // 1. Mint some tokens
        vm.startPrank(owner);
        token.mint(user1, 1000 * 1e18);
        token.mint(owner, 500 * 1e18);

        // 2. Update metadata
        token.updateMetadata("Updated Gold", "UGOLD", "Updated description");
        token.updateCategory("Rare Metals");
        token.updateStandardUnit(1e17); // 0.1 oz

        // 3. Set registry
        token.setAssetRegistry(assetRegistry);

        // 4. Try transfers with trading disabled (should fail for non-owner)
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert("CommodityToken: Trading is not enabled");
        token.transfer(user2, 100 * 1e18);

        // 5. Owner transfer should work even with trading disabled
        vm.prank(owner);
        token.transfer(user2, 100 * 1e18);

        // 6. Enable trading
        vm.prank(owner);
        token.setTradable(true);

        // 7. Now transfers should work for everyone
        vm.prank(user1);
        token.transfer(user2, 200 * 1e18);

        // 8. Check burn functionality
        vm.prank(user2);
        token.burn(50 * 1e18);

        // 9. Verify final state
        assertEq(token.commodityName(), "Updated Gold");
        assertEq(token.commoditySymbol(), "UGOLD");
        assertEq(token.commodityCategory(), "Rare Metals");
        assertEq(token.standardUnit(), 1e17);
        assertEq(token.assetRegistry(), assetRegistry);
        assertTrue(token.isTradable());

        assertEq(token.balanceOf(user1), 800 * 1e18);
        assertEq(token.balanceOf(user2), 250 * 1e18);
        assertEq(token.balanceOf(owner), 400 * 1e18);
        assertEq(token.totalSupply(), 1450 * 1e18);
    }

    function testMaxSupplyEdgeCases() public {
        // Test minting exactly max supply
        vm.startPrank(owner);
        token.mint(user1, MAX_SUPPLY);

        // Should fail when trying to mint 1 more
        vm.expectRevert("CommodityToken: Would exceed max supply");
        token.mint(user2, 1);

        // Burn some tokens
        vm.stopPrank();

        vm.prank(user1);
        token.burn(1000 * 1e18);

        // Now we should be able to mint again
        vm.prank(owner);
        token.mint(user2, 1000 * 1e18);

        assertEq(token.totalSupply(), MAX_SUPPLY);
    }
}