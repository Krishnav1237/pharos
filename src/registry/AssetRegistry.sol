// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetRegistry
 * @dev Maintains registry of tradable assets on Pharos Exchange
 */
contract AssetRegistry is AccessControl, Ownable {
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    enum AssetType { STOCK, COMMODITY, PAYMENT }

    struct Asset {
        address assetAddress;
        string name;
        string symbol;
        AssetType assetType;
        bool isActive;
        uint256 registrationTime;
    }

    // Asset address => Asset details
    mapping(address => Asset) public assets;
    address[] public assetAddresses;

    event AssetRegistered(
        address indexed assetAddress,
        string name,
        string symbol,
        AssetType assetType
    );
    event AssetStatusChanged(address indexed assetAddress, bool isActive);

    constructor(address initialOwner) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ASSET_MANAGER_ROLE, initialOwner);
    }

    /**
     * @dev Register asset with type detection
     * @param _assetAddress Address of the token
     * @param _assetType Type of the asset
     * @param _isActive Whether the asset is active
     */
    function registerAsset(
        address _assetAddress,
        AssetType _assetType,
        bool _isActive
    ) external onlyRole(ASSET_MANAGER_ROLE) {
        require(_assetAddress != address(0), "Invalid address");
        require(assets[_assetAddress].assetAddress == address(0), "Already registered");

        string memory name;
        string memory symbol;

        if (_assetType == AssetType.STOCK) {
            StockToken token = StockToken(_assetAddress);
            name = token.name();
            symbol = token.symbol();
        } else if (_assetType == AssetType.COMMODITY) {
            CommodityToken token = CommodityToken(_assetAddress);
            name = token.name();
            symbol = token.symbol();
        } else {
            revert("Use registerPaymentToken for payment assets");
        }

        _registerAsset(_assetAddress, name, symbol, _assetType, _isActive);
    }

    /**
     * @dev Register payment token (e.g., stablecoin)
     */
    function registerPaymentToken(
        address _assetAddress,
        string calldata _name,
        string calldata _symbol,
        bool _isActive
    ) external onlyRole(ASSET_MANAGER_ROLE) {
        require(_assetAddress != address(0), "Invalid address");
        require(assets[_assetAddress].assetAddress == address(0), "Already registered");

        _registerAsset(_assetAddress, _name, _symbol, AssetType.PAYMENT, _isActive);
    }

    /**
     * @dev Internal function to register an asset
     */
    function _registerAsset(
        address _assetAddress,
        string memory _name,
        string memory _symbol,
        AssetType _assetType,
        bool _isActive
    ) private {
        Asset memory newAsset = Asset({
            assetAddress: _assetAddress,
            name: _name,
            symbol: _symbol,
            assetType: _assetType,
            isActive: _isActive,
            registrationTime: block.timestamp
        });

        assets[_assetAddress] = newAsset;
        assetAddresses.push(_assetAddress);

        emit AssetRegistered(_assetAddress, _name, _symbol, _assetType);
    }

    /**
     * @dev Set the active status of an asset
     */
    function setAssetStatus(address _assetAddress, bool _isActive) external onlyRole(ASSET_MANAGER_ROLE) {
        require(assets[_assetAddress].assetAddress != address(0), "Asset not registered");

        assets[_assetAddress].isActive = _isActive;
        emit AssetStatusChanged(_assetAddress, _isActive);
    }

    /**
     * @dev Get asset details
     */
    function getAsset(address _assetAddress)
    external
    view
    returns (
        string memory name,
        string memory symbol,
        AssetType assetType,
        bool isActive,
        uint256 registrationTime
    )
    {
        Asset storage asset = assets[_assetAddress];
        require(asset.assetAddress != address(0), "Asset not registered");

        return (
            asset.name,
            asset.symbol,
            asset.assetType,
            asset.isActive,
            asset.registrationTime
        );
    }

    /**
     * @dev Get the number of registered assets
     */
    function getAssetCount() external view returns (uint256) {
        return assetAddresses.length;
    }

    /**
     * @dev Get asset by index
     */
    function getAssetByIndex(uint256 _index)
    external
    view
    returns (
        address assetAddress,
        string memory name,
        string memory symbol,
        AssetType assetType,
        bool isActive
    )
    {
        require(_index < assetAddresses.length, "Index out of bounds");
        address addrAtIndex = assetAddresses[_index];
        Asset storage asset = assets[addrAtIndex];

        return (
            asset.assetAddress,
            asset.name,
            asset.symbol,
            asset.assetType,
            asset.isActive
        );
    }

    /**
     * @dev Get all active assets of a specific type
     */
    function getActiveAssetsByType(AssetType _assetType)
    external
    view
    returns (address[] memory)
    {
        // First count matching assets
        uint256 count = 0;
        for (uint256 i = 0; i < assetAddresses.length; i++) {
            Asset storage asset = assets[assetAddresses[i]];
            if (asset.assetType == _assetType && asset.isActive) {
                count++;
            }
        }

        // Create and populate the result array
        address[] memory result = new address[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < assetAddresses.length && resultIndex < count; i++) {
            Asset storage asset = assets[assetAddresses[i]];
            if (asset.assetType == _assetType && asset.isActive) {
                result[resultIndex++] = asset.assetAddress;
            }
        }

        return result;
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

interface StockToken {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

interface CommodityToken {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}