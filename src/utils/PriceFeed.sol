// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceFeed
 * @dev Provides reliable price data for assets on Pharos Exchange
 * @notice This contract manages price feeds from multiple sources and ensures they are valid and up-to-date
 */
contract PriceFeed is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Price source enumeration
    enum PriceSource { MANUAL, CHAINLINK, AGGREGATED }

    // Main price data structure
    struct PriceData {
        uint256 price;           // Price with 18 decimals precision
        uint256 timestamp;       // When the price was last updated
        uint256 heartbeat;       // Maximum time (seconds) before price is considered stale
        PriceSource source;      // Source of the price data
        address primaryOracle;   // Address of primary oracle contract (if applicable)
        address secondaryOracle; // Address of secondary oracle (for redundancy)
        bool active;             // Whether this price feed is active
        uint256 failoverCount;   // Number of times failover has been triggered
    }

    // Asset address => Price data
    mapping(address => PriceData) public assetPrices;

    // Array of all assets with price feeds
    address[] public priceFeeds;

    // Configuration parameters
    uint256 public defaultHeartbeat = 24 hours;
    uint256 public deviationTolerance = 200; // 2% (in basis points)
    uint256 public emergencyDeviationThreshold = 1000; // 10% (in basis points)
    uint256 public minimumOracleQuorum = 1;

    // Circuit breaker state
    bool public manualPriceUpdatesSuspended;

    // Price update delay for security
    uint256 public manualPriceUpdateDelay = 30 minutes;
    mapping(address => PendingPriceUpdate) public pendingUpdates;

    struct PendingPriceUpdate {
        uint256 price;
        uint256 timestamp;
        address updater;
        bool exists;
    }

    // Events
    event PriceUpdated(address indexed asset, uint256 oldPrice, uint256 newPrice, PriceSource source);
    event PriceFeedAdded(address indexed asset, PriceSource source, address primaryOracle, address secondaryOracle, uint256 heartbeat);
    event PriceFeedRemoved(address indexed asset);
    event PriceFeedActivated(address indexed asset, bool active);
    event HeartbeatUpdated(address indexed asset, uint256 heartbeat);
    event DefaultHeartbeatUpdated(uint256 heartbeat);
    event DeviationToleranceUpdated(uint256 deviationTolerance);
    event EmergencyDeviationThresholdUpdated(uint256 threshold);
    event FailoverTriggered(address indexed asset, address indexed fromOracle, address indexed toOracle);
    event ManualUpdateSuspensionChanged(bool suspended);
    event PriceUpdateQueued(address indexed asset, uint256 price, address updater);
    event PriceUpdateCancelled(address indexed asset);
    event PriceUpdateExecuted(address indexed asset, uint256 price);
    event EmergencyPriceOverride(address indexed asset, uint256 oldPrice, uint256 newPrice);
    event OracleAdded(address indexed asset, address indexed oracle, bool isPrimary);
    event OracleRemoved(address indexed asset, address indexed oracle);
    event MinimumOracleQuorumUpdated(uint256 quorum);
    event ManualPriceUpdateDelayUpdated(uint256 delay);

    /**
     * @dev Constructor sets up admin role and grants it to contract deployer
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ============ Modifiers ============

    /**
     * @dev Ensures the price feed for an asset exists
     */
    modifier feedExists(address asset) {
        require(assetPrices[asset].timestamp > 0, "Price feed does not exist");
        _;
    }

    /**
     * @dev Ensures the price feed is active
     */
    modifier feedActive(address asset) {
        require(assetPrices[asset].active, "Price feed not active");
        _;
    }

    /**
     * @dev Checks if the provided oracle address is valid
     */
    modifier validOracle(address oracle) {
        require(oracle != address(0), "Invalid oracle address");
        require(_isValidOracleInterface(oracle), "Invalid oracle interface");
        _;
    }

    // ============ Admin Functions ============

    /**
     * @dev Add a new manual price feed
     * @param asset The asset address for which to add a price feed
     * @param initialPrice The initial price with 18 decimals precision
     * @param heartbeat Maximum time before price is considered stale
     */
    function addManualPriceFeed(
        address asset,
        uint256 initialPrice,
        uint256 heartbeat
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(asset != address(0), "Invalid asset address");
        require(initialPrice > 0, "Price must be greater than zero");
        require(assetPrices[asset].timestamp == 0, "Price feed already exists");

        uint256 actualHeartbeat = heartbeat > 0 ? heartbeat : defaultHeartbeat;

        assetPrices[asset] = PriceData({
            price: initialPrice,
            timestamp: block.timestamp,
            heartbeat: actualHeartbeat,
            source: PriceSource.MANUAL,
            primaryOracle: address(0),
            secondaryOracle: address(0),
            active: true,
            failoverCount: 0
        });
        priceFeeds.push(asset);

        emit PriceFeedAdded(asset, PriceSource.MANUAL, address(0), address(0), actualHeartbeat);
        emit PriceUpdated(asset, 0, initialPrice, PriceSource.MANUAL);
    }

    /**
     * @dev Add a Chainlink oracle price feed
     * @param asset The asset address for which to add a price feed
     * @param primaryOracle The primary Chainlink oracle address
     * @param secondaryOracle Optional secondary oracle for redundancy (can be address(0))
     * @param heartbeat Maximum time before price is considered stale
     */
    function addChainlinkPriceFeed(
        address asset,
        address primaryOracle,
        address secondaryOracle,
        uint256 heartbeat
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused validOracle(primaryOracle) {
        require(asset != address(0), "Invalid asset address");
        require(assetPrices[asset].timestamp == 0, "Price feed already exists");

        // Validate secondary oracle if provided
        if (secondaryOracle != address(0)) {
            require(_isValidOracleInterface(secondaryOracle), "Invalid secondary oracle interface");
        }

        // Get the current price from the primary oracle
        (uint256 price, uint256 timestamp, bool success) = _getChainlinkPriceWithResult(primaryOracle);
        require(success, "Failed to fetch oracle price");

        uint256 actualHeartbeat = heartbeat > 0 ? heartbeat : defaultHeartbeat;

        PriceSource source = secondaryOracle != address(0) ? PriceSource.AGGREGATED : PriceSource.CHAINLINK;

        assetPrices[asset] = PriceData({
            price: price,
            timestamp: timestamp,
            heartbeat: actualHeartbeat,
            source: source,
            primaryOracle: primaryOracle,
            secondaryOracle: secondaryOracle,
            active: true,
            failoverCount: 0
        });
        priceFeeds.push(asset);

        emit PriceFeedAdded(asset, source, primaryOracle, secondaryOracle, actualHeartbeat);
        emit PriceUpdated(asset, 0, price, source);
    }

    /**
     * @dev Remove a price feed
     * @param asset The asset address for which to remove the price feed
     */
    function removePriceFeed(address asset) external onlyRole(DEFAULT_ADMIN_ROLE) feedExists(asset) {
        // Find and remove from array using swap and pop technique
        uint256 index = type(uint256).max;
        for (uint256 i = 0; i < priceFeeds.length; i++) {
            if (priceFeeds[i] == asset) {
                index = i;
                break;
            }
        }

        require(index != type(uint256).max, "Asset not found in price feeds");

        // If not the last element, swap with the last one
        if (index < priceFeeds.length - 1) {
            priceFeeds[index] = priceFeeds[priceFeeds.length - 1];
        }

        // Remove the last element
        priceFeeds.pop();

        // Remove pending updates
        if (pendingUpdates[asset].exists) {
            delete pendingUpdates[asset];
        }

        // Delete price data
        delete assetPrices[asset];

        emit PriceFeedRemoved(asset);
    }

    /**
     * @dev Queue a manual price update (subject to time delay)
     * @param asset The asset address to update
     * @param newPrice The new price with 18 decimals precision
     */
    function queueManualPriceUpdate(
        address asset,
        uint256 newPrice
    ) external onlyRole(PRICE_UPDATER_ROLE) whenNotPaused feedExists(asset) feedActive(asset) {
        require(!manualPriceUpdatesSuspended, "Manual updates suspended");
        require(assetPrices[asset].source == PriceSource.MANUAL, "Not a manual price feed");
        require(newPrice > 0, "Price must be greater than zero");

        // Check for excessive price deviation
        PriceData storage priceData = assetPrices[asset];
        if (priceData.price > 0) {
            uint256 deviation = _calculateDeviation(priceData.price, newPrice);
            require(deviation <= deviationTolerance, "Price deviation exceeds tolerance");
        }

        // Create or update pending update
        pendingUpdates[asset] = PendingPriceUpdate({
            price: newPrice,
            timestamp: block.timestamp,
            updater: msg.sender,
            exists: true
        });

        emit PriceUpdateQueued(asset, newPrice, msg.sender);
    }

    /**
     * @dev Execute a queued manual price update after delay period
     * @param asset The asset address to update
     */
    function executeManualPriceUpdate(
        address asset
    ) external nonReentrant whenNotPaused feedExists(asset) feedActive(asset) {
        PendingPriceUpdate storage pendingUpdate = pendingUpdates[asset];
        require(pendingUpdate.exists, "No pending update");
        require(block.timestamp >= pendingUpdate.timestamp + manualPriceUpdateDelay, "Update delay not met");

        PriceData storage priceData = assetPrices[asset];
        require(priceData.source == PriceSource.MANUAL, "Not a manual price feed");

        uint256 oldPrice = priceData.price;
        uint256 newPrice = pendingUpdate.price;

        // Update price data
        priceData.price = newPrice;
        priceData.timestamp = block.timestamp;

        // Clean up pending update
        delete pendingUpdates[asset];

        emit PriceUpdateExecuted(asset, newPrice);
        emit PriceUpdated(asset, oldPrice, newPrice, PriceSource.MANUAL);
    }

    /**
     * @dev Cancel a queued manual price update
     * @param asset The asset address to cancel update for
     */
    function cancelManualPriceUpdate(
        address asset
    ) external whenNotPaused {
        PendingPriceUpdate storage pendingUpdate = pendingUpdates[asset];
        require(pendingUpdate.exists, "No pending update");

        // Allow cancellation by updater or admin
        require(
            msg.sender == pendingUpdate.updater ||
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to cancel"
        );

        delete pendingUpdates[asset];
        emit PriceUpdateCancelled(asset);
    }

    /**
     * @dev Update price from Chainlink oracle
     * @param asset The asset address to update from oracle
     */
    function updateChainlinkPrice(
        address asset
    ) external nonReentrant whenNotPaused feedExists(asset) feedActive(asset) {
        PriceData storage priceData = assetPrices[asset];

        require(
            priceData.source == PriceSource.CHAINLINK ||
            priceData.source == PriceSource.AGGREGATED,
            "Not an oracle price feed"
        );
        require(priceData.primaryOracle != address(0), "No primary oracle configured");

        uint256 oldPrice = priceData.price;
        uint256 newPrice;
        uint256 newTimestamp;
        bool success;

        // Try primary oracle first
        (newPrice, newTimestamp, success) = _getChainlinkPriceWithResult(priceData.primaryOracle);

        // If primary fails but secondary exists, try secondary
        if (!success && priceData.secondaryOracle != address(0)) {
            (newPrice, newTimestamp, success) = _getChainlinkPriceWithResult(priceData.secondaryOracle);

            if (success) {
                // Record the failover
                priceData.failoverCount++;
                emit FailoverTriggered(asset, priceData.primaryOracle, priceData.secondaryOracle);

                // Swap oracles so we try the working one first next time
                address temp = priceData.primaryOracle;
                priceData.primaryOracle = priceData.secondaryOracle;
                priceData.secondaryOracle = temp;
            }
        }

        require(success, "Failed to update from any oracle");

        // Don't update if the oracle timestamp hasn't changed
        require(newTimestamp > priceData.timestamp, "Oracle timestamp not newer");

        // Check for excessive deviation
        uint256 deviation = _calculateDeviation(priceData.price, newPrice);
        if (deviation > emergencyDeviationThreshold) {
            // If deviation is too high, don't update but notify
            emit EmergencyDeviationThresholdUpdated(deviation);
            revert("Price deviation exceeds emergency threshold");
        }

        // Update price data
        priceData.price = newPrice;
        priceData.timestamp = newTimestamp;

        emit PriceUpdated(asset, oldPrice, newPrice, priceData.source);
    }

    /**
     * @dev Update prices from Chainlink for multiple assets in one transaction
     * @param assets Array of asset addresses to update
     * @return successCount Number of successfully updated assets
     * @return failureCount Number of assets that failed to update
     */
    function batchUpdateChainlinkPrices(
        address[] calldata assets
    ) external nonReentrant whenNotPaused returns (uint256 successCount, uint256 failureCount) {
        successCount = 0;
        failureCount = 0;

        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];

            // Skip if feed doesn't exist or isn't active or isn't oracle-based
            if (!_isPriceOracleValid(asset)) {
                failureCount++;
                continue;
            }

            try this.updateChainlinkPrice(asset) {
                successCount++;
            } catch {
                failureCount++;
            }
        }
    }

    /**
     * @dev Set the active status of a price feed
     * @param asset The asset address to update status for
     * @param active Boolean indicating whether feed should be active
     */
    function setPriceFeedActive(
        address asset,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) feedExists(asset) {
        assetPrices[asset].active = active;
        emit PriceFeedActivated(asset, active);
    }

    /**
     * @dev Set the heartbeat for a specific price feed
     * @param asset The asset address to update heartbeat for
     * @param heartbeat New heartbeat value in seconds
     */
    function setHeartbeat(
        address asset,
        uint256 heartbeat
    ) external onlyRole(DEFAULT_ADMIN_ROLE) feedExists(asset) {
        require(heartbeat > 0, "Heartbeat must be greater than zero");

        assetPrices[asset].heartbeat = heartbeat;
        emit HeartbeatUpdated(asset, heartbeat);
    }

    /**
     * @dev Set the default heartbeat for new price feeds
     * @param heartbeat New default heartbeat value in seconds
     */
    function setDefaultHeartbeat(
        uint256 heartbeat
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(heartbeat > 0, "Heartbeat must be greater than zero");
        defaultHeartbeat = heartbeat;
        emit DefaultHeartbeatUpdated(heartbeat);
    }

    /**
     * @dev Set the price deviation tolerance (in basis points)
     * @param tolerance New tolerance value in basis points (100 = 1%)
     */
    function setDeviationTolerance(
        uint256 tolerance
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tolerance > 0, "Tolerance must be greater than zero");
        deviationTolerance = tolerance;
        emit DeviationToleranceUpdated(tolerance);
    }

    /**
     * @dev Set the emergency price deviation threshold (in basis points)
     * @param threshold New emergency threshold in basis points (100 = 1%)
     */
    function setEmergencyDeviationThreshold(
        uint256 threshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(threshold > deviationTolerance, "Emergency threshold must be higher than deviation tolerance");
        emergencyDeviationThreshold = threshold;
        emit EmergencyDeviationThresholdUpdated(threshold);
    }

    /**
     * @dev Set the manual price update delay
     * @param delay New delay in seconds
     */
    function setManualPriceUpdateDelay(
        uint256 delay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        manualPriceUpdateDelay = delay;
        emit ManualPriceUpdateDelayUpdated(delay);
    }

    /**
     * @dev Set minimum oracle quorum
     * @param quorum New minimum oracle quorum value
     */
    function setMinimumOracleQuorum(
        uint256 quorum
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(quorum > 0, "Quorum must be greater than zero");
        minimumOracleQuorum = quorum;
        emit MinimumOracleQuorumUpdated(quorum);
    }

    /**
     * @dev Add a secondary oracle for an asset
     * @param asset The asset address
     * @param oracle The oracle address to add
     */
    function addSecondaryOracle(
        address asset,
        address oracle
    ) external onlyRole(DEFAULT_ADMIN_ROLE) feedExists(asset) validOracle(oracle) {
        PriceData storage priceData = assetPrices[asset];

        require(
            priceData.source == PriceSource.CHAINLINK ||
            priceData.source == PriceSource.AGGREGATED,
            "Not an oracle price feed"
        );

        if (priceData.secondaryOracle == address(0)) {
            priceData.secondaryOracle = oracle;
            priceData.source = PriceSource.AGGREGATED;
        } else {
            // If we already have a secondary oracle, make this the secondary
            // and the current secondary becomes primary
            priceData.primaryOracle = priceData.secondaryOracle;
            priceData.secondaryOracle = oracle;
        }

        emit OracleAdded(asset, oracle, false);
    }

    /**
     * @dev Remove a secondary oracle for an asset
     * @param asset The asset address
     */
    function removeSecondaryOracle(
        address asset
    ) external onlyRole(DEFAULT_ADMIN_ROLE) feedExists(asset) {
        PriceData storage priceData = assetPrices[asset];

        require(priceData.secondaryOracle != address(0), "No secondary oracle to remove");

        address oldOracle = priceData.secondaryOracle;
        priceData.secondaryOracle = address(0);

        // Update source if we no longer have multiple oracles
        if (priceData.source == PriceSource.AGGREGATED) {
            priceData.source = PriceSource.CHAINLINK;
        }

        emit OracleRemoved(asset, oldOracle);
    }

    // ============ Emergency Functions ============

    /**
     * @dev Pause the contract - prevents price updates and adding feeds
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract - resumes normal operation
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /**
     * @dev Suspend all manual price updates
     * @param suspended Whether manual updates should be suspended
     */
    function setManualUpdatesSuspended(
        bool suspended
    ) external onlyRole(EMERGENCY_ROLE) {
        manualPriceUpdatesSuspended = suspended;
        emit ManualUpdateSuspensionChanged(suspended);
    }

    /**
     * @dev Emergency override of price in case of oracle failure
     * @param asset The asset address
     * @param price The new price to set
     */
    function emergencyPriceOverride(
        address asset,
        uint256 price
    ) external onlyRole(EMERGENCY_ROLE) feedExists(asset) {
        require(price > 0, "Price must be greater than zero");

        uint256 oldPrice = assetPrices[asset].price;
        assetPrices[asset].price = price;
        assetPrices[asset].timestamp = block.timestamp;

        emit EmergencyPriceOverride(asset, oldPrice, price);
        emit PriceUpdated(asset, oldPrice, price, assetPrices[asset].source);
    }

    // ============ View Functions ============

    /**
     * @dev Get the latest price for an asset
     * @param asset The asset address
     * @return price The latest price with 18 decimals precision
     * @return timestamp When the price was last updated
     * @return isStale Whether the price is stale based on heartbeat
     */
    function getLatestPrice(address asset)
    public
    view
    returns (
        uint256 price,
        uint256 timestamp,
        bool isStale
    )
    {
        PriceData storage priceData = assetPrices[asset];

        require(priceData.timestamp > 0, "Price feed not found");
        require(priceData.active, "Price feed not active");

        // Check if the price is stale based on heartbeat
        isStale = (block.timestamp - priceData.timestamp) > priceData.heartbeat;

        return (priceData.price, priceData.timestamp, isStale);
    }

    /**
     * @dev Get fresh price directly from Chainlink for an asset
     * @param asset The asset address
     * @return price The fresh price with 18 decimals precision
     * @return timestamp When the price was last updated
     * @return isStale Whether the price is stale based on heartbeat
     * @return success Whether the oracle price retrieval was successful
     */
    function getFreshPrice(address asset)
    external
    view
    returns (
        uint256 price,
        uint256 timestamp,
        bool isStale,
        bool success
    )
    {
        PriceData storage priceData = assetPrices[asset];

        if (priceData.timestamp == 0 || !priceData.active) {
            return (0, 0, true, false);
        }

        // For manual prices, just return the stored price
        if (priceData.source == PriceSource.MANUAL) {
            isStale = (block.timestamp - priceData.timestamp) > priceData.heartbeat;
            return (priceData.price, priceData.timestamp, isStale, true);
        }

        // For oracle feeds, try to get a fresh price
        if (priceData.primaryOracle != address(0)) {
            (price, timestamp, success) = _getChainlinkPriceWithResult(priceData.primaryOracle);

            // If primary fails but secondary exists, try secondary
            if (!success && priceData.secondaryOracle != address(0)) {
                (price, timestamp, success) = _getChainlinkPriceWithResult(priceData.secondaryOracle);
            }

            if (success) {
                isStale = (block.timestamp - timestamp) > priceData.heartbeat;
                return (price, timestamp, isStale, true);
            }
        }

        // If oracle calls failed, return stored price but mark as not fresh
        return (priceData.price, priceData.timestamp, true, false);
    }

    /**
     * @dev Get the number of price feeds
     * @return The total number of price feeds
     */
    function getPriceFeedCount() external view returns (uint256) {
        return priceFeeds.length;
    }

    /**
     * @dev Get price feed details by index
     * @param index The index in the priceFeeds array
     * @return asset The asset address
     * @return price The latest price with 18 decimals precision
     * @return timestamp When the price was last updated
     * @return source The source of the price data
     * @return primaryOracle The primary oracle address if any
     * @return secondaryOracle The secondary oracle address if any
     * @return active Whether the price feed is active
     * @return isStale Whether the price is stale based on heartbeat
     */
    function getPriceFeedByIndex(uint256 index)
    external
    view
    returns (
        address asset,
        uint256 price,
        uint256 timestamp,
        PriceSource source,
        address primaryOracle,
        address secondaryOracle,
        bool active,
        bool isStale
    )
    {
        require(index < priceFeeds.length, "Index out of bounds");

        asset = priceFeeds[index];
        PriceData storage priceData = assetPrices[asset];

        isStale = (block.timestamp - priceData.timestamp) > priceData.heartbeat;

        return (
            asset,
            priceData.price,
            priceData.timestamp,
            priceData.source,
            priceData.primaryOracle,
            priceData.secondaryOracle,
            priceData.active,
            isStale
        );
    }

    /**
     * @dev Get details of a pending price update
     * @param asset The asset address
     * @return exists Whether a pending update exists
     * @return price The pending price
     * @return timestamp When the update was queued
     * @return timeUntilExecution Time until the update can be executed
     * @return updater Address that queued the update
     */
    function getPendingPriceUpdate(address asset)
    external
    view
    returns (
        bool exists,
        uint256 price,
        uint256 timestamp,
        uint256 timeUntilExecution,
        address updater
    )
    {
        PendingPriceUpdate storage update = pendingUpdates[asset];

        exists = update.exists;
        if (!exists) {
            return (false, 0, 0, 0, address(0));
        }

        price = update.price;
        timestamp = update.timestamp;
        updater = update.updater;

        uint256 executionTime = timestamp + manualPriceUpdateDelay;
        if (block.timestamp >= executionTime) {
            timeUntilExecution = 0;
        } else {
            timeUntilExecution = executionTime - block.timestamp;
        }
    }

    /**
     * @dev Check if a Chainlink's price is valid
     * @param oracle The oracle address to check
     * @return valid Whether the oracle returns valid data
     */
    function isChainlinkPriceValid(address oracle) external view returns (bool valid) {
        (,, valid) = _getChainlinkPriceWithResult(oracle);
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to get price from Chainlink oracle with error handling
     * @param oracle The oracle address
     * @return price The price with 18 decimals precision
     * @return timestamp When the price was last updated
     * @return success Whether the call succeeded
     */
    function _getChainlinkPriceWithResult(address oracle)
    internal
    view
    returns (uint256 price, uint256 timestamp, bool success)
    {
        if (oracle == address(0)) {
            return (0, 0, false);
        }

        try AggregatorV3Interface(oracle).latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 timeStamp,
            uint80
        ) {
            // Validate the response
            if (answer <= 0 || timeStamp == 0) {
                return (0, 0, false);
            }

            // Normalize to 18 decimals
            try AggregatorV3Interface(oracle).decimals() returns (uint8 decimals) {
                if (decimals < 18) {
                    price = uint256(answer) * (10 ** (18 - decimals));
                } else if (decimals > 18) {
                    price = uint256(answer) / (10 ** (decimals - 18));
                } else {
                    price = uint256(answer);
                }

                return (price, timeStamp, true);
            } catch {
                return (0, 0, false);
            }
        } catch {
            return (0, 0, false);
        }
    }

    /**
     * @dev Calculate the deviation between two prices in basis points
     * @param oldPrice The old price
     * @param newPrice The new price
     * @return The deviation in basis points (100 = 1%)
     */
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0 || newPrice == 0) {
            return type(uint256).max;
        }

        if (newPrice > oldPrice) {
            return ((newPrice - oldPrice) * 10000) / oldPrice;
        } else {
            return ((oldPrice - newPrice) * 10000) / oldPrice;
        }
    }

    /**
     * @dev Check if an oracle has a valid Chainlink interface
     * @param oracle The oracle address to check
     * @return Whether the oracle has a valid interface
     */
    function _isValidOracleInterface(address oracle) internal view returns (bool) {
        if (oracle == address(0)) {
            return false;
        }

        try AggregatorV3Interface(oracle).decimals() returns (uint8) {
            try AggregatorV3Interface(oracle).latestRoundData() returns (
                uint80,
                int256,
                uint256,
                uint256,
                uint80
            ) {
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    /**
     * @dev Check if a price feed is a valid oracle feed
     * @param asset The asset address to check
     * @return Whether the asset has a valid oracle price feed
     */
    function _isPriceOracleValid(address asset) internal view returns (bool) {
        PriceData storage priceData = assetPrices[asset];

        // Check if feed exists and active
        if (priceData.timestamp == 0 || !priceData.active) {
            return false;
        }

        // Check if it's an oracle-based feed
        if (priceData.source != PriceSource.CHAINLINK && priceData.source != PriceSource.AGGREGATED) {
            return false;
        }

        // Check if it has at least a primary oracle
        if (priceData.primaryOracle == address(0)) {
            return false;
        }

        return true;
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