// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/exchange/MatchingEngine.sol";

contract DeployMatchingEngine is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = vm.envAddress("INITIAL_OWNER");

        vm.startBroadcast(deployerPrivateKey);

        MatchingEngine engine = new MatchingEngine(initialOwner);

        vm.stopBroadcast();

        console.log("MatchingEngine deployed at:", address(engine));
    }
}