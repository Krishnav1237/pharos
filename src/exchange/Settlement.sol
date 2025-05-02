// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Settlement
 * @dev Handles trade settlement and fee distribution for Pharos Exchange
 */
contract Settlement is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    address public feeCollector;
    bool public isPaused;

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

    constructor(address initialOwner, address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector address");

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(SETTLEMENT_ROLE, initialOwner);

        feeCollector = _feeCollector;
    }

    /**
     * @dev Modifier to check if the contract is paused
     */
    modifier whenNotPaused() {
        require(!isPaused, "Settlement: Contract is paused");
        _;
    }

    /**
     * @dev Set the fee collector address
     * @param _feeCollector New fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    /**
     * @dev Pause or unpause the contract
     * @param _isPaused New pause state
     */
    function setPaused(bool _isPaused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isPaused = _isPaused;
        emit Paused(_isPaused);
    }

    /**
     * @dev Settle a trade between a buyer and a seller
     * @param buyer Address of the buyer
     * @param seller Address of the seller
     * @param tokenAsset Address of the token being traded
     * @param paymentAsset Address of the payment token
     * @param amount Amount of the token asset being traded
     * @param price Price per token in payment asset terms
     * @param fee Trading fee in payment asset terms
     */
    function settleTrade(
        address buyer,
        address seller,
        address tokenAsset,
        address paymentAsset,
        uint256 amount,
        uint256 price,
        uint256 fee
    ) external onlyRole(SETTLEMENT_ROLE) whenNotPaused nonReentrant {
        require(buyer != address(0) && seller != address(0), "Invalid buyer or seller address");
        require(tokenAsset != address(0) && paymentAsset != address(0), "Invalid asset address");
        require(amount > 0 && price > 0, "Invalid trade parameters");

        uint256 totalCost = (amount * price) / 1e18;

        // Transfer payment from buyer to seller
        IERC20(paymentAsset).safeTransferFrom(buyer, seller, totalCost - fee);

        // Transfer fee to fee collector
        if (fee > 0) {
            IERC20(paymentAsset).safeTransferFrom(buyer, feeCollector, fee);
        }

        // Transfer token asset from seller to buyer
        IERC20(tokenAsset).safeTransferFrom(seller, buyer, amount);

        emit TradeSettled(buyer, seller, tokenAsset, paymentAsset, amount, price, fee);
    }
}