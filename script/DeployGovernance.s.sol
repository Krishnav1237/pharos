// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/utils/Governance.sol";

contract DeployGovernance is Script {
    function run() external {
        // Load private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get admin address from environment
        address admin = vm.envAddress("INITIAL_OWNER");

        // Start deployment
        vm.startBroadcast(deployerPrivateKey);

        Governance governance = new Governance(admin);

        vm.stopBroadcast();

        // Output deployment information
        console.log("Governance contract deployed at:", address(governance));
        console.log("Configuration:");
        console.log("- Admin:", admin);
        console.log("- Voting Duration:", governance.votingDuration(), "seconds");
        console.log("- Execution Delay:", governance.executionDelay(), "seconds");
    }
}