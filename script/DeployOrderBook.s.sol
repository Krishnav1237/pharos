// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/exchange/OrderBook.sol";

contract DeployOrderBook is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        address feeCollector = vm.envAddress("FEE_COLLECTOR_ADDRESS");

        OrderBook orderBook = new OrderBook(deployer, feeCollector);

        address matchingEngine = vm.envAddress("MATCHING_ENGINE_ADDRESS");
        orderBook.setMatchingEngine(matchingEngine);

        vm.stopBroadcast();
        console.log("OrderBook deployed at:", address(orderBook));
    }
}