// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StockToken
 * @dev ERC20 token representing a stock asset on Pharos Exchange
 */
contract StockToken is ERC20, ERC20Burnable, Ownable {
    // Metadata for the stock
    string public companyName;
    string public ticker;
    string public companyDescription;
    uint256 public maxSupply;
    address public assetRegistry;

    // Trading properties
    bool public isTradable = false;

    // Events
    event StockMetadataUpdated(string companyName, string ticker, string companyDescription);
    event TradingStatusChanged(bool isTradable);
    event RegistryUpdated(address newRegistry);

    /**
     * @dev Constructor to create a new stock token
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _companyName,
        string memory _ticker,
        string memory _companyDescription,
        uint256 _maxSupply,
        address initialOwner
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        companyName = _companyName;
        ticker = _ticker;
        companyDescription = _companyDescription;
        maxSupply = _maxSupply;
    }

    /**
     * @dev Mint new tokens, respecting the max supply
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "StockToken: Would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @dev Update the stock metadata
     * @param _companyName New company name
     * @param _ticker New ticker
     * @param _companyDescription New company description
     */
    function updateMetadata(
        string memory _companyName,
        string memory _ticker,
        string memory _companyDescription
    ) public onlyOwner {
        companyName = _companyName;
        ticker = _ticker;
        companyDescription = _companyDescription;

        emit StockMetadataUpdated(_companyName, _ticker, _companyDescription);
    }

    /**
     * @dev Set if the token is tradable on the exchange
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
        require(_assetRegistry != address(0), "StockToken: Invalid registry address");
        assetRegistry = _assetRegistry;
        emit RegistryUpdated(_assetRegistry);
    }

    /**
     * @dev Override transfer function to check if trading is allowed
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(isTradable || msg.sender == owner(), "StockToken: Trading is not enabled");
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom function to check if trading is allowed
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(isTradable || msg.sender == owner(), "StockToken: Trading is not enabled");
        return super.transferFrom(from, to, amount);
    }
}