// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/registry/AssetRegistry.sol";

contract DeployAssetRegistry is Script {
    function run() external {
        // Load private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Parse command-line arguments
        string memory jsonArgs = vm.readFile("deploy-registry-args.json");

        // Extract arguments from JSON
        address initialOwner = abi.decode(vm.parseJson(jsonArgs, ".initialOwner"), (address));
        address[] memory assetManagers;

        // Check if asset managers are provided
        if (vm.keyExists(jsonArgs, ".assetManagers")) {
            assetManagers = abi.decode(vm.parseJson(jsonArgs, ".assetManagers"), (address[]));
        }

        // Deploy the contract
        vm.startBroadcast(deployerPrivateKey);

        AssetRegistry registry = new AssetRegistry(initialOwner);

        // Grant asset manager role to additional managers if provided
        for (uint i = 0; i < assetManagers.length; i++) {
            registry.grantRole(registry.ASSET_MANAGER_ROLE(), assetManagers[i]);
        }

        vm.stopBroadcast();

        // Output deployment information
        console.log("AssetRegistry deployed at:", address(registry));
        console.log("Initial owner:", initialOwner);
        console.log("Asset managers:");
        console.log("- Owner (default):", initialOwner);

        for (uint i = 0; i < assetManagers.length; i++) {
            console.log("- Additional manager:", assetManagers[i]);
        }
    }
}