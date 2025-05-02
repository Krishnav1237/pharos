// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console2.sol"; // Import console2 for logging
import "../src/utils/PriceFeed.sol";

contract DeployPriceFeed is Script {
    function run() external {
        // Load private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Parse command-line arguments if a JSON file is provided
        string memory jsonArgs = vm.readFile("deploy-pricefeed-args.json");
        bytes memory parsedJson = vm.parseJson(jsonArgs);

        // Extract optional configuration from JSON
        uint256 defaultHeartbeat = 24 hours;
        uint256 deviationTolerance = 200; // 2% default
        uint256 emergencyDeviationThreshold = 1000; // 10% default
        uint256 manualPriceUpdateDelay = 30 minutes;

        // Check if each parameter exists in JSON and override defaults if so
        if (vm.keyExists(jsonArgs, ".defaultHeartbeat")) {
            defaultHeartbeat = abi.decode(vm.parseJson(jsonArgs, ".defaultHeartbeat"), (uint256));
        }

        if (vm.keyExists(jsonArgs, ".deviationTolerance")) {
            deviationTolerance = abi.decode(vm.parseJson(jsonArgs, ".deviationTolerance"), (uint256));
        }

        if (vm.keyExists(jsonArgs, ".emergencyDeviationThreshold")) {
            emergencyDeviationThreshold = abi.decode(vm.parseJson(jsonArgs, ".emergencyDeviationThreshold"), (uint256));
        }

        if (vm.keyExists(jsonArgs, ".manualPriceUpdateDelay")) {
            manualPriceUpdateDelay = abi.decode(vm.parseJson(jsonArgs, ".manualPriceUpdateDelay"), (uint256));
        }

        // Initialize initial role assignments
        address initialOwner = vm.envOr("INITIAL_OWNER", address(0));
        if (initialOwner == address(0) && vm.keyExists(jsonArgs, ".initialOwner")) {
            initialOwner = abi.decode(vm.parseJson(jsonArgs, ".initialOwner"), (address));
        }

        address[] memory priceUpdaters = new address[](0);
        address[] memory emergencyOperators = new address[](0);

        // Extract role assignments if provided
        if (vm.keyExists(jsonArgs, ".priceUpdaters")) {
            priceUpdaters = abi.decode(vm.parseJson(jsonArgs, ".priceUpdaters"), (address[]));
        }

        if (vm.keyExists(jsonArgs, ".emergencyOperators")) {
            emergencyOperators = abi.decode(vm.parseJson(jsonArgs, ".emergencyOperators"), (address[]));
        }

        // Deploy the contract
        vm.startBroadcast(deployerPrivateKey);

        PriceFeed priceFeed = new PriceFeed();

        // Configure settings if different from defaults
        if (defaultHeartbeat != 24 hours) {
            priceFeed.setDefaultHeartbeat(defaultHeartbeat);
        }

        if (deviationTolerance != 200) {
            priceFeed.setDeviationTolerance(deviationTolerance);
        }

        if (manualPriceUpdateDelay != 30 minutes) {
            priceFeed.setManualPriceUpdateDelay(manualPriceUpdateDelay);
        }

        // Assign roles
        for (uint i = 0; i < priceUpdaters.length; i++) {
            priceFeed.grantRole(priceFeed.PRICE_UPDATER_ROLE(), priceUpdaters[i]);
        }

        for (uint i = 0; i < emergencyOperators.length; i++) {
            priceFeed.grantRole(priceFeed.EMERGENCY_ROLE(), emergencyOperators[i]);
        }

        vm.stopBroadcast();

        // Output deployment information
        console2.log("PriceFeed deployed at:", address(priceFeed));
        console2.log("Configuration:");
        console2.log("- Default Heartbeat:", priceFeed.defaultHeartbeat());
        console2.log("- Deviation Tolerance:", priceFeed.deviationTolerance(), "basis points");
        console2.log("- Manual Price Update Delay:", priceFeed.manualPriceUpdateDelay());
    }
}