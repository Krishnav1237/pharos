// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../src/tokens/StockToken.sol";

contract StockTokenTest is Test {
    StockToken public token;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public assetRegistry = address(4);

    // Token parameters
    string constant TOKEN_NAME = "Apple Inc.";
    string constant TOKEN_SYMBOL = "AAPL";
    string constant COMPANY_NAME = "Apple Inc.";
    string constant TICKER = "AAPL";
    string constant COMPANY_DESCRIPTION = "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.";
    uint256 constant MAX_SUPPLY = 10000 * 1e18; // 10,000 shares

    // Events
    event StockMetadataUpdated(string companyName, string ticker, string companyDescription);
    event TradingStatusChanged(bool isTradable);
    event RegistryUpdated(address newRegistry);

    function setUp() public {
        vm.startPrank(owner);
        token = new StockToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            COMPANY_NAME,
            TICKER,
            COMPANY_DESCRIPTION,
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

        // Stock attributes
        assertEq(token.companyName(), COMPANY_NAME);
        assertEq(token.ticker(), TICKER);
        assertEq(token.companyDescription(), COMPANY_DESCRIPTION);
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
        vm.expectRevert("StockToken: Would exceed max supply");
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
        string memory newName = "Microsoft Corporation";
        string memory newTicker = "MSFT";
        string memory newDescription = "Microsoft Corporation engages in the development and support of software, services, devices, and solutions.";

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit StockMetadataUpdated(newName, newTicker, newDescription);
        token.updateMetadata(newName, newTicker, newDescription);

        assertEq(token.companyName(), newName);
        assertEq(token.ticker(), newTicker);
        assertEq(token.companyDescription(), newDescription);
    }

    function testUpdateMetadataFailsFromNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.updateMetadata("New Company", "NEW", "New Description");
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
        vm.expectRevert("StockToken: Invalid registry address");
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
        vm.expectRevert("StockToken: Trading is not enabled");
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
        vm.expectRevert("StockToken: Trading is not enabled");
        token.transferFrom(user1, user2, amount);
    }

    // ============ Integration Tests ============

    function testFullLifecycle() public {
        // 1. Mint some tokens
        vm.startPrank(owner);
        token.mint(user1, 1000 * 1e18);
        token.mint(owner, 500 * 1e18);

        // 2. Update metadata
        token.updateMetadata("Updated Company", "UPD", "Updated description");

        // 3. Set registry
        token.setAssetRegistry(assetRegistry);

        // 4. Try transfers with trading disabled (should fail for non-owner)
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert("StockToken: Trading is not enabled");
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
        assertEq(token.companyName(), "Updated Company");
        assertEq(token.ticker(), "UPD");
        assertEq(token.companyDescription(), "Updated description");
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
        vm.expectRevert("StockToken: Would exceed max supply");
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

    // ============ Stress Tests ============

    function testManyTransfers() public {
        // Initial minting
        vm.prank(owner);
        token.mint(user1, 1000 * 1e18);

        // Enable trading
        vm.prank(owner);
        token.setTradable(true);

        // Perform multiple small transfers
        vm.startPrank(user1);
        for (uint i = 0; i < 10; i++) {
            token.transfer(user2, 10 * 1e18);
        }
        vm.stopPrank();

        // Perform multiple transfers back
        vm.startPrank(user2);
        for (uint i = 0; i < 5; i++) {
            token.transfer(user1, 10 * 1e18);
        }
        vm.stopPrank();

        // Verify balances
        assertEq(token.balanceOf(user1), 950 * 1e18);
        assertEq(token.balanceOf(user2), 50 * 1e18);
        assertEq(token.totalSupply(), 1000 * 1e18);
    }

    function testFuzzTransfer(uint8 iterations, uint8 amount) public {
        uint256 scaledAmount = uint256(amount) * 1e17; // 0-25.5 tokens

        // Skip if amount would be zero
        vm.assume(scaledAmount > 0);

        // Initial minting - 1000 tokens
        vm.prank(owner);
        token.mint(user1, 1000 * 1e18);

        // Enable trading
        vm.prank(owner);
        token.setTradable(true);

        // Cap iterations to prevent excessive test runtime
        uint8 capped_iterations = iterations % 20;

        uint256 totalTransferred = 0;

        // Perform variable number of transfers with variable amounts
        vm.startPrank(user1);
        for (uint8 i = 0; i < capped_iterations; i++) {
            // Check if we've transferred too much
            if (totalTransferred + scaledAmount > 1000 * 1e18) {
                break;
            }

            token.transfer(user2, scaledAmount);
            totalTransferred += scaledAmount;
        }
        vm.stopPrank();

        // Verify balances
        assertEq(token.balanceOf(user1), 1000 * 1e18 - totalTransferred);
        assertEq(token.balanceOf(user2), totalTransferred);
        assertEq(token.totalSupply(), 1000 * 1e18);
    }
}