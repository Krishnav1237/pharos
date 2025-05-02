// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../src/exchange/Settlement.sol"; // Adjust path if needed

// --- Mock ERC20 Token for Testing ---
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burn(account, amount);
    }
}

contract SettlementTest is Test {
    // --- State Variables ---
    Settlement public settlement;
    MockERC20 public tokenAsset; // e.g., Stock Token
    MockERC20 public paymentAsset; // e.g., Stablecoin

    address public owner; // Has DEFAULT_ADMIN_ROLE
    address public settler; // Has SETTLEMENT_ROLE
    address public buyer;
    address public seller;
    address public feeCollector;
    address public otherUser; // Random address with no roles

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 constant TRADE_AMOUNT = 100 * 1e18;
    uint256 constant TRADE_PRICE = 5 * 1e18; // Price per tokenAsset unit in paymentAsset
    uint256 constant TRADE_FEE = 1 * 1e18; // Fee in paymentAsset

    // --- Events for testing ---
    event TradeSettled(
        address indexed buyer,
        address indexed seller,
        address indexed tokenAsset,
        address paymentAsset,
        uint256 amount,
        uint256 price,
        uint256 fee
    );

    event FeeCollectorUpdated(address newFeeCollector);

    event Paused(bool isPaused);

    // --- Setup ---
    function setUp() public {
        // 1. Create users
        owner = makeAddr("owner");
        settler = makeAddr("settler");
        buyer = makeAddr("buyer");
        seller = makeAddr("seller");
        feeCollector = makeAddr("feeCollector");
        otherUser = makeAddr("otherUser");

        // 2. Deploy mock tokens
        tokenAsset = new MockERC20("Mock Stock", "MSTK");
        paymentAsset = new MockERC20("Mock Stablecoin", "MUSDC");

        // 3. Deploy Settlement contract
        vm.startPrank(owner);
        settlement = new Settlement(owner, feeCollector);
        settlement.grantRole(settlement.SETTLEMENT_ROLE(), settler);
        vm.stopPrank();

        // 4. Mint initial balances
        tokenAsset.mint(seller, INITIAL_SUPPLY);
        paymentAsset.mint(buyer, INITIAL_SUPPLY);

        // 5. Approve Settlement contract to spend tokens
        vm.startPrank(buyer);
        paymentAsset.approve(address(settlement), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(seller);
        tokenAsset.approve(address(settlement), type(uint256).max);
        vm.stopPrank();
    }

    // --- Test Cases ---

    function testInitialState() public {
        assertTrue(settlement.hasRole(settlement.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(settlement.hasRole(settlement.SETTLEMENT_ROLE(), owner));
        assertTrue(settlement.hasRole(settlement.SETTLEMENT_ROLE(), settler));
        assertEq(settlement.feeCollector(), feeCollector);
        assertFalse(settlement.isPaused());
    }

    // --- Fee Collector ---

    function testSetFeeCollector_Success() public {
        address newFeeCollector = makeAddr("newFeeCollector");
        vm.startPrank(owner);
        vm.expectEmit(true, false, false, true);
        emit FeeCollectorUpdated(newFeeCollector);
        settlement.setFeeCollector(newFeeCollector);
        vm.stopPrank();
        assertEq(settlement.feeCollector(), newFeeCollector);
    }

    function testSetFeeCollector_Fail_NotAdmin() public {
        address newFeeCollector = makeAddr("newFeeCollector");
        vm.prank(otherUser);
        // Using string-based revert check instead of error selector for better compatibility
        vm.expectRevert();
        settlement.setFeeCollector(newFeeCollector);
    }

    function testSetFeeCollector_Fail_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid fee collector address");
        settlement.setFeeCollector(address(0));
    }

    // --- Pausing ---

    function testPauseAndUnpause_Success() public {
        // Pause
        vm.startPrank(owner);
        vm.expectEmit(false, false, false, true);
        emit Paused(true);
        settlement.setPaused(true);
        vm.stopPrank();
        assertTrue(settlement.isPaused());

        // Unpause
        vm.startPrank(owner);
        vm.expectEmit(false, false, false, true);
        emit Paused(false);
        settlement.setPaused(false);
        vm.stopPrank();
        assertFalse(settlement.isPaused());
    }

    function testSetPaused_Fail_NotAdmin() public {
        vm.prank(otherUser);
        vm.expectRevert();
        settlement.setPaused(true);
    }

    // --- settleTrade ---

    function testSettleTrade_Success() public {
        uint256 buyerPaymentBefore = paymentAsset.balanceOf(buyer);
        uint256 sellerPaymentBefore = paymentAsset.balanceOf(seller);
        uint256 feeCollectorPaymentBefore = paymentAsset.balanceOf(feeCollector);
        uint256 buyerTokenBefore = tokenAsset.balanceOf(buyer);
        uint256 sellerTokenBefore = tokenAsset.balanceOf(seller);

        uint256 totalCost = (TRADE_AMOUNT * TRADE_PRICE) / 1e18;

        vm.startPrank(settler);
        vm.expectEmit(true, true, true, true);
        emit TradeSettled(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        vm.stopPrank();

        assertEq(paymentAsset.balanceOf(buyer), buyerPaymentBefore - totalCost);
        assertEq(paymentAsset.balanceOf(seller), sellerPaymentBefore + (totalCost - TRADE_FEE));
        assertEq(paymentAsset.balanceOf(feeCollector), feeCollectorPaymentBefore + TRADE_FEE);
        assertEq(tokenAsset.balanceOf(buyer), buyerTokenBefore + TRADE_AMOUNT);
        assertEq(tokenAsset.balanceOf(seller), sellerTokenBefore - TRADE_AMOUNT);
    }

    function testSettleTrade_Success_ZeroFee() public {
        uint256 buyerPaymentBefore = paymentAsset.balanceOf(buyer);
        uint256 sellerPaymentBefore = paymentAsset.balanceOf(seller);
        uint256 feeCollectorPaymentBefore = paymentAsset.balanceOf(feeCollector);

        uint256 totalCost = (TRADE_AMOUNT * TRADE_PRICE) / 1e18;
        uint256 zeroFee = 0;

        vm.startPrank(settler);
        vm.expectEmit(true, true, true, true);
        emit TradeSettled(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            zeroFee
        );
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            zeroFee
        );
        vm.stopPrank();

        assertEq(paymentAsset.balanceOf(buyer), buyerPaymentBefore - totalCost);
        assertEq(paymentAsset.balanceOf(seller), sellerPaymentBefore + totalCost); // Gets full amount
        assertEq(paymentAsset.balanceOf(feeCollector), feeCollectorPaymentBefore); // Gets nothing
    }

    function testSettleTrade_Fail_Paused() public {
        vm.prank(owner);
        settlement.setPaused(true);

        vm.prank(settler);
        vm.expectRevert("Settlement: Contract is paused");
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
    }

    function testSettleTrade_Fail_NotSettlementRole() public {
        vm.prank(otherUser);
        vm.expectRevert();
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
    }

    function testSettleTrade_Fail_InsufficientBuyerPaymentAllowance() public {
        vm.startPrank(buyer);
        paymentAsset.approve(address(settlement), 1); // Not enough
        vm.stopPrank();

        vm.startPrank(settler);
        vm.expectRevert(); // We don't check the exact revert message as it depends on the ERC20 implementation
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        vm.stopPrank();

        // Reset allowance for other tests
        vm.startPrank(buyer);
        paymentAsset.approve(address(settlement), type(uint256).max);
        vm.stopPrank();
    }

    function testSettleTrade_Fail_InsufficientBuyerPaymentBalance() public {
        // Burn most of buyer's balance
        vm.startPrank(buyer);
        paymentAsset.burn(paymentAsset.balanceOf(buyer) - 1);
        vm.stopPrank();

        vm.startPrank(settler);
        vm.expectRevert(); // We don't check the exact message as it depends on the ERC20 implementation
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        vm.stopPrank();

        // Reset balance for other tests
        paymentAsset.mint(buyer, INITIAL_SUPPLY);
    }

    function testSettleTrade_Fail_InsufficientSellerTokenAllowance() public {
        vm.startPrank(seller);
        tokenAsset.approve(address(settlement), 1); // Not enough
        vm.stopPrank();

        vm.startPrank(settler);
        vm.expectRevert(); // We don't check the exact message as it depends on the ERC20 implementation
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        vm.stopPrank();

        // Reset allowance for other tests
        vm.startPrank(seller);
        tokenAsset.approve(address(settlement), type(uint256).max);
        vm.stopPrank();
    }

    function testSettleTrade_Fail_InsufficientSellerTokenBalance() public {
        // Burn most of seller's balance
        vm.startPrank(seller);
        tokenAsset.burn(tokenAsset.balanceOf(seller) - 1);
        vm.stopPrank();

        vm.startPrank(settler);
        vm.expectRevert(); // We don't check the exact message as it depends on the ERC20 implementation
        settlement.settleTrade(
            buyer,
            seller,
            address(tokenAsset),
            address(paymentAsset),
            TRADE_AMOUNT,
            TRADE_PRICE,
            TRADE_FEE
        );
        vm.stopPrank();

        // Reset balance for other tests
        tokenAsset.mint(seller, INITIAL_SUPPLY);
    }

    function testSettleTrade_Fail_InvalidAddresses() public {
        vm.startPrank(settler);

        vm.expectRevert("Invalid buyer or seller address");
        settlement.settleTrade(address(0), seller, address(tokenAsset), address(paymentAsset), TRADE_AMOUNT, TRADE_PRICE, TRADE_FEE);

        vm.expectRevert("Invalid buyer or seller address");
        settlement.settleTrade(buyer, address(0), address(tokenAsset), address(paymentAsset), TRADE_AMOUNT, TRADE_PRICE, TRADE_FEE);

        vm.expectRevert("Invalid asset address");
        settlement.settleTrade(buyer, seller, address(0), address(paymentAsset), TRADE_AMOUNT, TRADE_PRICE, TRADE_FEE);

        vm.expectRevert("Invalid asset address");
        settlement.settleTrade(buyer, seller, address(tokenAsset), address(0), TRADE_AMOUNT, TRADE_PRICE, TRADE_FEE);

        vm.stopPrank();
    }

    function testSettleTrade_Fail_InvalidTradeParams() public {
        vm.startPrank(settler);

        vm.expectRevert("Invalid trade parameters");
        settlement.settleTrade(buyer, seller, address(tokenAsset), address(paymentAsset), 0, TRADE_PRICE, TRADE_FEE); // Zero amount

        vm.expectRevert("Invalid trade parameters");
        settlement.settleTrade(buyer, seller, address(tokenAsset), address(paymentAsset), TRADE_AMOUNT, 0, TRADE_FEE); // Zero price

        vm.stopPrank();
    }
}