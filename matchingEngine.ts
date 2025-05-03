// matchingEngine.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { MatchingEngine__factory } from './types/ethers-contracts';

// Load environment variables
dotenv.config();

// Define delay utility function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Try to extract the revert reason from ethers error
        const message = error.message;

        // Look for the revert reason in the error message
        const revertReasonMatch = message.match(/reason="([^"]+)"/);
        if (revertReasonMatch) {
            return revertReasonMatch[1];
        }

        return message;
    }
    return String(error);
}

// Use the correct enum ordering from the contract
// Corrected based on contract definition
enum OrderSide {
    BUY = 0,
    SELL = 1
}

enum OrderType {
    LIMIT = 0,
    MARKET = 1
}

async function main() {
    try {
        console.log("========== MATCHING ENGINE INTERACTION SCRIPT STARTING ==========");

        // Setup provider connection
        const rpcUrl = process.env.PHAROS_RPC_URL;
        if (!rpcUrl) {
            throw new Error("PHAROS_RPC_URL not set in .env file");
        }
        console.log(`RPC URL: ${rpcUrl}`);

        console.log("Provider initialized");
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name || 'unknown'} (chainId: ${network.chainId})`);

        // Setup wallet
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in .env file");
        }
        console.log("Private key found in .env");

        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`Connected with wallet address: ${wallet.address}`);

        const ethBalance = await provider.getBalance(wallet.address);
        console.log(`Wallet ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);

        // Connect to an existing MatchingEngine
        const engineAddress = process.env.MATCHING_ENGINE_ADDRESS;

        if (!engineAddress) {
            throw new Error("MATCHING_ENGINE_ADDRESS not set in .env file");
        }
        console.log(`Matching Engine contract address: ${engineAddress}`);

        // Check if contract exists at the specified address
        console.log("Checking if contract exists at the specified address...");
        const code = await provider.getCode(engineAddress);

        if (code === '0x') {
            throw new Error("No contract exists at the specified address");
        }
        console.log(`Contract exists at address (bytecode size: ${(code.length - 2) / 2} bytes)`);

        // Create contract instance
        console.log("Creating contract instance...");
        const matchingEngine = MatchingEngine__factory.connect(engineAddress, wallet);
        console.log("Contract instance created");

        // Set variables to control which operations to perform
        const shouldPerformActiveOperations = true;

        // Test basic read functions
        console.log("\n------- Testing basic matching engine functions -------");

        // Get admin roles if available
        try {
            console.log("Checking if engine has role-based access control...");

            // Check for DEFAULT_ADMIN_ROLE
            const adminRole = await matchingEngine.DEFAULT_ADMIN_ROLE();
            console.log(`DEFAULT_ADMIN_ROLE: ${adminRole}`);

            const hasAdminRole = await matchingEngine.hasRole(adminRole, wallet.address);
            console.log(`Does our wallet have admin role? ${hasAdminRole ? 'Yes' : 'No'}`);

            // Check for MATCHER_ROLE
            const matcherRole = await matchingEngine.MATCHER_ROLE();
            console.log(`MATCHER_ROLE: ${matcherRole}`);

            const hasMatcherRole = await matchingEngine.hasRole(matcherRole, wallet.address);
            console.log(`Does our wallet have matcher role? ${hasMatcherRole ? 'Yes' : 'No'}`);
        } catch (error) {
            console.log("This contract does not use AccessControl pattern.");
        }

        // Get slippage tolerance
        try {
            console.log("Checking slippage tolerance...");
            const slippageTolerance = await matchingEngine.slippageTolerance();
            console.log(`Current slippage tolerance: ${slippageTolerance.toString()} basis points (${slippageTolerance.toNumber() / 100}%)`);
        } catch (error) {
            console.log(`Error getting slippage tolerance: ${getErrorMessage(error)}`);
        }

        // Get next orderBook.ts ID
        try {
            console.log("Getting total orders count...");
            const nextOrderId = await matchingEngine.nextOrderId();
            console.log(`Next order ID: ${nextOrderId.toString()} (total placed orders)`);
        } catch (error) {
            console.log(`Error getting next order ID: ${getErrorMessage(error)}`);
        }

        // Check a few orders if they exist
        try {
            // Use nextOrderId instead of orderCount
            const nextOrderId = await matchingEngine.nextOrderId();

            if (nextOrderId.gt(0)) {
                console.log("\n------- Checking existing orders -------");

                const maxOrdersToCheck = nextOrderId.lt(5) ? nextOrderId.toNumber() : 5;

                for (let i = 0; i < maxOrdersToCheck; i++) {
                    try {
                        console.log(`Checking order ${i}...`);
                        const order = await matchingEngine.orders(i);

                        console.log(`Order details:`);
                        console.log(`  ID: ${order.id}`);
                        console.log(`  Trader: ${order.trader}`);
                        console.log(`  Side: ${order.side === OrderSide.BUY ? 'BUY' : 'SELL'}`);
                        console.log(`  Price: ${ethers.utils.formatUnits(order.price, 18)}`);
                        console.log(`  Quantity: ${ethers.utils.formatUnits(order.quantity, 18)}`);
                        console.log(`  Filled: ${ethers.utils.formatUnits(order.filled, 18)}`);
                        console.log(`  Type: ${order.orderType === OrderType.MARKET ? 'MARKET' : 'LIMIT'}`);
                        console.log(`  Timestamp: ${new Date(order.timestamp.toNumber() * 1000).toISOString()}`);
                    } catch (error) {
                        console.log(`Error getting order ${i}: ${getErrorMessage(error)}`);
                    }
                }
            } else {
                console.log("No orders exist yet");
            }
        } catch (error) {
            console.log(`Error checking existing orders: ${getErrorMessage(error)}`);
        }

        // Active operations
        if (!shouldPerformActiveOperations) {
            console.log("\nActive operations are disabled. Set shouldPerformActiveOperations = true to enable them.");
        } else {
            console.log("\n------- Performing state-changing operations -------");

            // Check permissions first
            let hasMatcherRole = false;
            let hasAdminRole = false;

            try {
                const matcherRole = await matchingEngine.MATCHER_ROLE();
                hasMatcherRole = await matchingEngine.hasRole(matcherRole, wallet.address);

                const adminRole = await matchingEngine.DEFAULT_ADMIN_ROLE();
                hasAdminRole = await matchingEngine.hasRole(adminRole, wallet.address);
            } catch (error) {
                console.log("Could not check roles");
            }

            console.log(`Permission check results:`);
            console.log(`  Has admin role: ${hasAdminRole}`);
            console.log(`  Has matcher role: ${hasMatcherRole}`);

            // 1. Place a limit orderBook.ts (should work for anyone)
            try {
                console.log("\n----- Placing limit orderBook.ts -----");

                // Define orderBook.ts parameters - using the correct enum values
                const side = OrderSide.BUY;
                // Use a more reasonable price - the earlier error might be due to price/quantity being too high
                const price = ethers.utils.parseEther("0.01");  // 0.01 tokens
                const quantity = ethers.utils.parseEther("0.1"); // 0.1 units
                const orderType = OrderType.LIMIT;

                console.log(`Creating a ${side === OrderSide.BUY ? 'BUY' : 'SELL'} limit order:`);
                console.log(`  Price: ${ethers.utils.formatEther(price)}`);
                console.log(`  Quantity: ${ethers.utils.formatEther(quantity)}`);

                // Estimate gas to make sure it will succeed
                try {
                    const gasEstimate = await matchingEngine.estimateGas.placeOrder(
                        side,
                        price,
                        quantity,
                        orderType
                    );
                    console.log(`Gas estimate for placing order: ${gasEstimate.toString()}`);

                    // Add more gas to ensure the transaction succeeds
                    const tx = await matchingEngine.placeOrder(
                        side,
                        price,
                        quantity,
                        orderType,
                        { gasLimit: gasEstimate.mul(120).div(100) } // Add 20% to estimated gas
                    );
                    console.log(`Transaction hash: ${tx.hash}`);

                    const receipt = await tx.wait();
                    console.log(`Order placed successfully in block ${receipt.blockNumber}`);

                    // Try to extract orderBook.ts ID from events
                    if (receipt.events) {
                        for (const event of receipt.events) {
                            if (event.event === 'OrderPlaced') {
                                const orderId = event.args?.orderId;
                                console.log(`Order ID: ${orderId}`);
                            }
                        }
                    }
                } catch (error) {
                    console.log(`Failed to place order: ${getErrorMessage(error)}`);
                }

                // Add delay between transactions
                await delay(2000);
            } catch (error) {
                console.error("Error placing limit orderBook.ts:", getErrorMessage(error));
            }

            // 2. Update slippage tolerance (requires admin permission)
            if (hasAdminRole) {
                try {
                    console.log("\n----- Updating slippage tolerance -----");

                    // Get current slippage tolerance first
                    const currentSlippage = await matchingEngine.slippageTolerance();
                    console.log(`Current slippage tolerance: ${currentSlippage.toString()} basis points (${currentSlippage.toNumber() / 100}%)`);

                    // Calculate new slippage - toggle between 50 and 100 basis points
                    let newSlippage: number;
                    if (currentSlippage.toNumber() === 50) {
                        newSlippage = 100; // 1%
                    } else {
                        newSlippage = 50; // 0.5%
                    }

                    console.log(`Setting new slippage tolerance to ${newSlippage} basis points (${newSlippage / 100}%)`);

                    const tx = await matchingEngine.setSlippageTolerance(newSlippage);
                    console.log(`Transaction hash: ${tx.hash}`);

                    await tx.wait();
                    console.log("Slippage tolerance updated successfully");

                    // Verify the change
                    const updatedSlippage = await matchingEngine.slippageTolerance();
                    console.log(`Updated slippage tolerance: ${updatedSlippage.toString()} basis points (${updatedSlippage.toNumber() / 100}%)`);

                    // Add delay between transactions
                    await delay(2000);
                } catch (error) {
                    console.error("Error updating slippage tolerance:", getErrorMessage(error));
                }
            } else {
                console.log("\n----- Skipping slippage tolerance update (requires admin role) -----");
            }

            // 3. Match orders (requires matcher role)
            if (hasMatcherRole) {
                try {
                    console.log("\n----- Matching orders -----");

                    // Get the next orderBook.ts ID to check if we have at least two orders
                    const nextOrderId = await matchingEngine.nextOrderId();

                    if (nextOrderId.gte(2)) {
                        console.log("Checking for potential matches in the last two orders...");

                        // Get the last two orders
                        const lastOrderId = nextOrderId.sub(1);
                        const secondLastOrderId = nextOrderId.sub(2);

                        const lastOrder = await matchingEngine.orders(lastOrderId);
                        const secondLastOrder = await matchingEngine.orders(secondLastOrderId);

                        // Check if they are on opposite sides (BUY/SELL)
                        if (lastOrder.side !== secondLastOrder.side) {
                            console.log("Found two orders on opposite sides:");
                            console.log(`Order ${lastOrderId}: ${lastOrder.side === OrderSide.BUY ? 'BUY' : 'SELL'}`);
                            console.log(`Order ${secondLastOrderId}: ${secondLastOrder.side === OrderSide.BUY ? 'BUY' : 'SELL'}`);

                            // Match the orders
                            let buyOrderIds: ethers.BigNumber[];
                            let sellOrderIds: ethers.BigNumber[];

                            if (lastOrder.side === OrderSide.BUY) {
                                buyOrderIds = [lastOrderId];
                                sellOrderIds = [secondLastOrderId];
                            } else {
                                buyOrderIds = [secondLastOrderId];
                                sellOrderIds = [lastOrderId];
                            }

                            console.log("Attempting to match orders...");

                            const tx = await matchingEngine.matchOrders(buyOrderIds, sellOrderIds);
                            console.log(`Transaction hash: ${tx.hash}`);

                            const receipt = await tx.wait();
                            console.log(`Orders matched successfully in block ${receipt.blockNumber}`);

                            // Check for match events - use OrderMatched (singular) instead of OrdersMatched
                            if (receipt.events) {
                                for (const event of receipt.events) {
                                    if (event.event === 'OrderMatched') {
                                        console.log(`Match event detected: ${JSON.stringify(event.args)}`);
                                    }
                                }
                            }
                        } else {
                            console.log("The last two orders are on the same side, cannot match.");
                        }
                    } else {
                        console.log(`Not enough orders to match. Next order ID: ${nextOrderId.toString()}`);
                    }

                    // Add delay between transactions
                    await delay(2000);
                } catch (error) {
                    console.error("Error matching orders:", getErrorMessage(error));
                }
            } else {
                console.log("\n----- Skipping orderBook.ts matching (requires matcher role) -----");
            }

            // 4. Cancel an orderBook.ts (any orderBook.ts owner can do this)
            try {
                console.log("\n----- Cancelling an orderBook.ts -----");

                // Get next orderBook.ts ID
                const nextOrderId = await matchingEngine.nextOrderId();

                if (nextOrderId.gt(0)) {
                    // Find an orderBook.ts that belongs to our wallet
                    let ourOrderId: ethers.BigNumber | null = null;

                    console.log("Searching for an orderBook.ts placed by our wallet...");

                    // Check the last 5 orders or fewer if there aren't that many
                    const maxOrdersToCheck = nextOrderId.lt(5) ? nextOrderId.toNumber() : 5;

                    for (let i = nextOrderId.sub(1); i.gte(nextOrderId.sub(maxOrdersToCheck)) && i.gte(0); i = i.sub(1)) {
                        const order = await matchingEngine.orders(i);

                        if (order.trader === wallet.address) {
                            ourOrderId = i;
                            break;
                        }
                    }

                    if (ourOrderId) {
                        console.log(`Found our order with ID: ${ourOrderId}`);

                        // Get orderBook.ts details
                        const order = await matchingEngine.orders(ourOrderId);
                        console.log(`Order details:`);
                        console.log(`  Side: ${order.side === OrderSide.BUY ? 'BUY' : 'SELL'}`);
                        console.log(`  Price: ${ethers.utils.formatEther(order.price)}`);
                        console.log(`  Quantity: ${ethers.utils.formatEther(order.quantity)}`);
                        console.log(`  Filled: ${ethers.utils.formatEther(order.filled)}`);

                        console.log("Cancelling the orderBook.ts...");

                        // Estimate gas first to detect potential issues
                        const gasEstimate = await matchingEngine.estimateGas.cancelOrder(ourOrderId);
                        console.log(`Gas estimate for cancelling order: ${gasEstimate.toString()}`);

                        // Add 20% extra gas to ensure transaction succeeds
                        const tx = await matchingEngine.cancelOrder(ourOrderId, {
                            gasLimit: gasEstimate.mul(120).div(100)
                        });
                        console.log(`Transaction hash: ${tx.hash}`);

                        const receipt = await tx.wait();
                        console.log(`Order cancelled successfully in block ${receipt.blockNumber}`);

                        // Verify the cancellation
                        const updatedOrder = await matchingEngine.orders(ourOrderId);
                        console.log(`Post-cancellation trader address: ${updatedOrder.trader}`);
                        if (updatedOrder.trader === ethers.constants.AddressZero) {
                            console.log("Order successfully deleted (trader address set to zero address)");
                        } else {
                            console.log("Order still exists but may be marked as cancelled");
                        }
                    } else {
                        console.log("No orders found that were placed by our wallet");
                    }
                } else {
                    console.log("No orders available to cancel");
                }

                // Add delay after cancellation
                await delay(2000);
            } catch (error) {
                console.error("Error cancelling orderBook.ts:", getErrorMessage(error));
            }

            // 5. Grant matcher role (requires admin role)
            if (hasAdminRole) {
                try {
                    console.log("\n----- Managing roles -----");

                    const testAddress = process.env.TEST_ADDRESS;
                    if (testAddress) {
                        console.log(`Using address from .env: ${testAddress}`);

                        // Get the matcher role
                        const matcherRole = await matchingEngine.MATCHER_ROLE();

                        // Check if the test address already has the matcher role
                        const hasRole = await matchingEngine.hasRole(matcherRole, testAddress);
                        console.log(`Does test address have matcher role? ${hasRole ? 'Yes' : 'No'}`);

                        if (!hasRole) {
                            console.log("Granting matcher role to test address...");

                            const tx = await matchingEngine.grantRole(matcherRole, testAddress);
                            console.log(`Transaction hash: ${tx.hash}`);

                            await tx.wait();
                            console.log("Matcher role granted successfully");

                            // Verify the role was granted
                            const updatedHasRole = await matchingEngine.hasRole(matcherRole, testAddress);
                            console.log(`Test address now has matcher role: ${updatedHasRole ? 'Yes' : 'No'}`);
                        } else {
                            console.log("Revoking matcher role from test address...");

                            const tx = await matchingEngine.revokeRole(matcherRole, testAddress);
                            console.log(`Transaction hash: ${tx.hash}`);

                            await tx.wait();
                            console.log("Matcher role revoked successfully");

                            // Verify the role was revoked
                            const updatedHasRole = await matchingEngine.hasRole(matcherRole, testAddress);
                            console.log(`Test address now has matcher role: ${updatedHasRole ? 'Yes' : 'No'}`);
                        }
                    } else {
                        console.log("TEST_ADDRESS not set in .env file, skipping role management");
                    }
                } catch (error) {
                    console.error("Error managing roles:", getErrorMessage(error));
                }
            } else {
                console.log("\n----- Skipping role management (requires admin role) -----");
            }
        }

        console.log("\n========== SCRIPT COMPLETED SUCCESSFULLY ==========");
        return 0;

    } catch (error) {
        console.error("\n========== SCRIPT FAILED ==========");
        console.error("Error details:", getErrorMessage(error));
        return 1;
    }
}

// Execute the script
main()
    .then(exitCode => {
        console.log(`Exiting with success code ${exitCode}`);
        process.exit(exitCode);
    })
    .catch(error => {
        console.error("Unhandled error:", getErrorMessage(error));
        process.exit(1);
    });