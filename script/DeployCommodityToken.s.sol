// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/tokens/CommodityToken.sol";

contract DeployCommodityToken is Script {
    function run() external {
        // Load private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Parse command-line arguments
        string memory jsonArgs = vm.readFile("deploy-args.json");
        bytes memory parsedJson = vm.parseJson(jsonArgs);

        // Extract arguments from JSON
        string memory tokenName = abi.decode(vm.parseJson(jsonArgs, ".tokenName"), (string));
        string memory tokenSymbol = abi.decode(vm.parseJson(jsonArgs, ".tokenSymbol"), (string));
        string memory commodityName = abi.decode(vm.parseJson(jsonArgs, ".commodityName"), (string));
        string memory commoditySymbol = abi.decode(vm.parseJson(jsonArgs, ".commoditySymbol"), (string));
        string memory commodityDescription = abi.decode(vm.parseJson(jsonArgs, ".commodityDescription"), (string));
        string memory commodityCategory = abi.decode(vm.parseJson(jsonArgs, ".commodityCategory"), (string));
        uint256 standardUnit = abi.decode(vm.parseJson(jsonArgs, ".standardUnit"), (uint256));
        uint256 maxSupply = abi.decode(vm.parseJson(jsonArgs, ".maxSupply"), (uint256));
        address initialOwner = abi.decode(vm.parseJson(jsonArgs, ".initialOwner"), (address));

        // Optional parameters with defaults
        bool enableTrading = false;
        address assetRegistry = address(0);

        // Check if optional parameters exist in JSON
        if (vm.keyExists(jsonArgs, ".enableTrading")) {
            enableTrading = abi.decode(vm.parseJson(jsonArgs, ".enableTrading"), (bool));
        }

        if (vm.keyExists(jsonArgs, ".assetRegistry")) {
            assetRegistry = abi.decode(vm.parseJson(jsonArgs, ".assetRegistry"), (address));
        }

        // Deploy the contract
        vm.startBroadcast(deployerPrivateKey);

        CommodityToken token = new CommodityToken(
            tokenName,
            tokenSymbol,
            commodityName,
            commoditySymbol,
            commodityDescription,
            commodityCategory,
            standardUnit,
            maxSupply,
            initialOwner
        );

        // Set up initial configuration if specified
        if (enableTrading) {
            token.setTradable(true);
        }

        if (assetRegistry != address(0)) {
            token.setAssetRegistry(assetRegistry);
        }

        vm.stopBroadcast();

        // Output deployment information
        console.log("CommodityToken deployed at:", address(token));
        console.log("Token Details:");
        console.log("- Name:", token.name());
        console.log("- Symbol:", token.symbol());
        console.log("- Commodity Name:", token.commodityName());
        console.log("- Commodity Symbol:", token.commoditySymbol());
        console.log("- Commodity Category:", token.commodityCategory());
        console.log("- Max Supply:", token.maxSupply() / 1e18, "units");
        console.log("- Trading Enabled:", token.isTradable());
    }
}