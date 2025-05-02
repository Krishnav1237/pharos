// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/exchange/Settlement.sol";

contract DeploySettlement is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = vm.envAddress("INITIAL_OWNER");
        address feeCollector = vm.envAddress("FEE_COLLECTOR_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Settlement settlement = new Settlement(initialOwner, feeCollector);

        vm.stopBroadcast();

        console.log("Settlement deployed at:", address(settlement));
    }
}