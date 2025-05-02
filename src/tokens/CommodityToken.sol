// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommodityToken
 * @dev ERC20 token representing a physical commodity asset on the exchange
 * Provides functionality for managing commodity metadata, trading controls,
 * and supply management specific to tokenized commodities.
 */
contract CommodityToken is ERC20, ERC20Burnable, Ownable {
    // ============ State Variables ============

    /// @dev Full name of the commodity (e.g., "Gold Bullion")
    string public commodityName;

    /// @dev Trading symbol for the commodity (e.g., "GOLD")
    string public commoditySymbol;

    /// @dev Detailed description of the commodity
    string public commodityDescription;

    /// @dev Category the commodity belongs to (e.g., "Precious Metals", "Energy")
    string public commodityCategory;

    /// @dev Standard unit of measure (e.g., 1e18 for 1 troy ounce with 18 decimals)
    uint256 public standardUnit;

    /// @dev Maximum supply cap for this commodity token
    uint256 public maxSupply;

    /// @dev Address of the asset registry contract
    address public assetRegistry;

    /// @dev Flag indicating if the token can be traded on the exchange
    bool public isTradable = false;

    // ============ Events ============

    /// @dev Emitted when the commodity's basic metadata is updated
    event CommodityMetadataUpdated(string commodityName, string commoditySymbol, string commodityDescription);

    /// @dev Emitted when the commodity's category is updated
    event CommodityCategoryUpdated(string commodityCategory);

    /// @dev Emitted when the standard unit of measure is updated
    event StandardUnitUpdated(uint256 standardUnit);

    /// @dev Emitted when the trading status is changed
    event TradingStatusChanged(bool isTradable);

    /// @dev Emitted when the asset registry address is updated
    event RegistryUpdated(address newRegistry);

    /**
     * @dev Constructor initializes the commodity token with its metadata
     * @param _name ERC20 token name
     * @param _symbol ERC20 token symbol
     * @param _commodityName Full descriptive name of the commodity
     * @param _commoditySymbol Trading symbol used for the commodity
     * @param _commodityDescription Detailed description of the commodity
     * @param _commodityCategory Category the commodity belongs to
     * @param _standardUnit Standard unit of measure for the commodity
     * @param _maxSupply Maximum supply cap for this token
     * @param initialOwner Address of the initial contract owner
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _commodityName,
        string memory _commoditySymbol,
        string memory _commodityDescription,
        string memory _commodityCategory,
        uint256 _standardUnit,
        uint256 _maxSupply,
        address initialOwner
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        commodityName = _commodityName;
        commoditySymbol = _commoditySymbol;
        commodityDescription = _commodityDescription;
        commodityCategory = _commodityCategory;
        standardUnit = _standardUnit;
        maxSupply = _maxSupply;
    }

    /**
     * @dev Mint new tokens, respecting the max supply limit
     * @param to Address that will receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "CommodityToken: Would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @dev Update the commodity's basic metadata
     * @param _commodityName New commodity name
     * @param _commoditySymbol New commodity symbol
     * @param _commodityDescription New commodity description
     */
    function updateMetadata(
        string memory _commodityName,
        string memory _commoditySymbol,
        string memory _commodityDescription
    ) public onlyOwner {
        commodityName = _commodityName;
        commoditySymbol = _commoditySymbol;
        commodityDescription = _commodityDescription;

        emit CommodityMetadataUpdated(_commodityName, _commoditySymbol, _commodityDescription);
    }

    /**
     * @dev Update the commodity's category
     * @param _commodityCategory New category
     */
    function updateCategory(string memory _commodityCategory) public onlyOwner {
        commodityCategory = _commodityCategory;
        emit CommodityCategoryUpdated(_commodityCategory);
    }

    /**
     * @dev Update the standard unit of measure for the commodity
     * @param _standardUnit New standard unit value
     */
    function updateStandardUnit(uint256 _standardUnit) public onlyOwner {
        standardUnit = _standardUnit;
        emit StandardUnitUpdated(_standardUnit);
    }

    /**
     * @dev Enable or disable trading of this token on the exchange
     * @param _isTradable New tradable status
     */
    function setTradable(bool _isTradable) public onlyOwner {
        isTradable = _isTradable;
        emit TradingStatusChanged(_isTradable);
    }

    /**
     * @dev Set the asset registry contract address
     * @param _assetRegistry Address of the asset registry contract
     */
    function setAssetRegistry(address _assetRegistry) public onlyOwner {
        require(_assetRegistry != address(0), "CommodityToken: Invalid registry address");
        assetRegistry = _assetRegistry;
        emit RegistryUpdated(_assetRegistry);
    }

    /**
     * @dev Override transfer function to check if trading is enabled
     * Only the owner can transfer when trading is disabled
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(isTradable || msg.sender == owner(), "CommodityToken: Trading is not enabled");
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom function to check if trading is enabled
     * Only the owner can transfer when trading is disabled
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(isTradable || msg.sender == owner(), "CommodityToken: Trading is not enabled");
        return super.transferFrom(from, to, amount);
    }
}