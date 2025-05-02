// activePairsTest.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { OrderBook__factory } from './types/ethers-contracts';

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

        // Check for transaction failure status
        if (message.includes('transaction failed') && message.includes('receipt={"status":0')) {
            return "Transaction reverted on-chain. Check contract logic (e.g., require statements).";
        }

        return message;
    }
    return String(error);
}

// Use the correct enum ordering from the contract
enum OrderSide {
    BUY = 0,
    SELL = 1
}

enum OrderType {
    LIMIT = 0,
    MARKET = 1
}

enum OrderStatus {
    OPEN = 0,
    FILLED = 1,
    PARTIAL_FILLED = 2,
    CANCELLED = 3,
    EXPIRED = 4
}

async function main() {
    try {
        console.log("========== ACTIVE PAIRS TEST STARTING ==========");

        // Setup provider connection
        const rpcUrl = process.env.PHAROS_RPC_URL;
        if (!rpcUrl) {
            throw new Error("PHAROS_RPC_URL not set in .env file");
        }
        console.log(`RPC URL: ${rpcUrl}`);

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name || 'unknown'} (chainId: ${network.chainId})`);

        // Setup wallet
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in .env file");
        }
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`Connected with wallet address: ${wallet.address}`);

        // Connect to OrderBook contract
        const orderBookAddress = process.env.ORDER_BOOK_ADDRESS;
        if (!orderBookAddress) {
            throw new Error("ORDER_BOOK_ADDRESS not set in .env file");
        }
        console.log(`OrderBook contract address: ${orderBookAddress}`);

        // Create contract instance
        console.log("Creating contract instance...");
        const orderBook = OrderBook__factory.connect(orderBookAddress, wallet);
        console.log("Contract instance created");

        // Check if we're the owner (required for admin operations)
        const owner = await orderBook.owner();
        const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
        console.log(`Owner check: ${isOwner ? 'You are the owner' : 'You are not the owner'}`);

        if (!isOwner) {
            throw new Error("Must be contract owner to activate asset pairs");
        }

        // Step 1: List all asset pairs and select which ones to activate
        console.log("\n------- Listing and Activating Asset Pairs -------");

        // Count array elements by iterating through indices
        let pairKeysCount = 0;
        try {
            for (let i = 0; ; i++) {
                await orderBook.assetPairKeys(i);
                pairKeysCount = i + 1;
            }
        } catch (error) {
            // We've reached the end of the array
            console.log(`Total asset pairs: ${pairKeysCount}`);
        }

        // Store pair info for the order test
        let selectedPairKey: string | null = null;
        let selectedTokenAsset: string | null = null;
        let selectedPaymentAsset: string | null = null;

        // Choose which pairs to activate
        // Add the indices of pairs you want to activate to this array
        // 0 -> first pair, 1 -> second pair, 2 -> third pair, etc.
        const pairsToSelect = [2]; // <<< MODIFIED: Selecting the third pair (index 2)

        // Loop through all pairs to find and activate selected ones
        console.log("\nAvailable pairs and activation status:");
        for (let i = 0; i < pairKeysCount; i++) {
            const pairKey = await orderBook.assetPairKeys(i);
            const pair = await orderBook.assetPairs(pairKey);

            console.log(`\nPair ${i+1}:`);
            console.log(`  Key: ${pairKey}`);
            console.log(`  Token asset: ${pair.tokenAsset}`);
            console.log(`  Payment asset: ${pair.paymentAsset}`);
            console.log(`  Current Status: ${pair.isActive ? 'Active' : 'Inactive'}`);

            if (pairsToSelect.includes(i)) {
                console.log(`  Selected for activation/verification.`);

                // If this is the first selected pair, store its details for the order creation test
                if (!selectedPairKey) {
                    selectedPairKey = pairKey;
                    selectedTokenAsset = pair.tokenAsset;
                    selectedPaymentAsset = pair.paymentAsset;
                    console.log(`  -> Will be used for order test.`);
                }

                // Activate this pair only if it's not already active
                if (!pair.isActive) {
                    console.log(`  Activating pair ${i+1}...`);
                    try {
                        const activateTx = await orderBook.setAssetPairStatus(pairKey, true);
                        console.log(`  Activation tx hash: ${activateTx.hash}`);
                        await activateTx.wait();

                        // Verify activation immediately
                        const verifyPair = await orderBook.assetPairs(pairKey);
                        console.log(`  Pair ${i+1} status after update: ${verifyPair.isActive ? 'Active' : 'Inactive'}`);
                        if (!verifyPair.isActive) {
                            console.warn(`  Warning: Failed to activate pair ${i+1} (${pairKey})`);
                        }
                    } catch (activationError) {
                        console.error(`  Error activating pair ${i+1} (${pairKey}):`, getErrorMessage(activationError));
                        // Decide if you want to throw or continue if one activation fails
                    }
                } else {
                    console.log(`  Pair ${i+1} is already active.`);
                }
            }
        }

        // Ensure a pair was selected for the order test
        if (!selectedPairKey || !selectedTokenAsset || !selectedPaymentAsset) {
            // Adjust the error message based on whether pairsToSelect was empty or if selected pairs didn't exist
            if (pairsToSelect.length === 0) {
                throw new Error("No pairs were specified in the 'pairsToSelect' array.");
            } else {
                // Check if the requested index exists
                const maxRequestedIndex = Math.max(...pairsToSelect);
                if (maxRequestedIndex >= pairKeysCount) {
                    throw new Error(`Requested pair index ${maxRequestedIndex} is out of bounds. Only ${pairKeysCount} pairs exist (indices 0 to ${pairKeysCount - 1}).`);
                }
                throw new Error("Could not find or select a valid asset pair for the order test based on the indices in 'pairsToSelect'.");
            }
        }

        // Step 2: Verify the selected pair for the order test is active
        console.log(`\n------- Verifying Selected Pair for Order Test -------`);
        console.log(`Verifying status of pair with key: ${selectedPairKey}`);
        const finalSelectedPair = await orderBook.assetPairs(selectedPairKey);
        console.log(`  Token: ${finalSelectedPair.tokenAsset}`);
        console.log(`  Payment: ${finalSelectedPair.paymentAsset}`);
        console.log(`  Status: ${finalSelectedPair.isActive ? 'Active' : 'Inactive'}`);

        if (!finalSelectedPair.isActive) {
            throw new Error(`The selected pair (${selectedPairKey}) intended for the order test is not active. Activation might have failed earlier.`);
        }
        console.log("Selected pair is active. Proceeding with order creation.");


        // Step 3: Create a limit order for the activated pair
        console.log("\n------- Creating a Limit Order -------");

        // Define order parameters
        const side = OrderSide.BUY;
        const orderType = OrderType.LIMIT;
        const amount = ethers.utils.parseEther("0.1"); // 0.1 token units
        const price = ethers.utils.parseEther("0.01");  // 0.01 payment tokens per token unit

        console.log(`Creating a ${side === OrderSide.BUY ? 'BUY' : 'SELL'} limit order:`);
        console.log(`  Token asset: ${selectedTokenAsset}`);
        console.log(`  Payment asset: ${selectedPaymentAsset}`);
        console.log(`  Amount: ${ethers.utils.formatEther(amount)}`);
        console.log(`  Price: ${ethers.utils.formatEther(price)}`);

        // Check ERC20 approvals for payment asset (since this is a BUY order)
        const erc20Interface = new ethers.utils.Interface([
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function balanceOf(address account) view returns (uint256)"
        ]);

        const erc20 = new ethers.Contract(selectedPaymentAsset, erc20Interface, wallet);

        // Check current allowance
        const allowance = await erc20.allowance(wallet.address, orderBookAddress);
        console.log(`Current allowance: ${ethers.utils.formatEther(allowance)}`);

        // Calculate required amount (amount * price for BUY order)
        const requiredAmount = amount.mul(price).div(ethers.utils.parseEther("1"));
        console.log(`Required approval: ${ethers.utils.formatEther(requiredAmount)}`);

        // Check ERC20 balance
        const balance = await erc20.balanceOf(wallet.address);
        console.log(`Token balance: ${ethers.utils.formatEther(balance)}`);

        if (balance.lt(requiredAmount)) {
            console.log(`Insufficient token balance. Need ${ethers.utils.formatEther(requiredAmount)} but have ${ethers.utils.formatEther(balance)}`);
            throw new Error("Insufficient token balance");
        }

        // Approve if needed
        if (allowance.lt(requiredAmount)) {
            console.log("Insufficient allowance. Approving tokens...");

            // Approve a large amount to avoid frequent approvals
            const approvalAmount = ethers.utils.parseEther("1000"); // 1000 tokens

            const approveTx = await erc20.approve(orderBookAddress, approvalAmount);
            console.log(`Approval transaction hash: ${approveTx.hash}`);

            await approveTx.wait();
            console.log("Approval confirmed");

            // Verify new allowance
            const newAllowance = await erc20.allowance(wallet.address, orderBookAddress);
            console.log(`New allowance: ${ethers.utils.formatEther(newAllowance)}`);
        } else {
            console.log("Sufficient allowance already exists");
        }

        // Now create the order with extra gas
        const gasEstimate = await orderBook.estimateGas.createOrder(
            selectedTokenAsset,
            selectedPaymentAsset,
            amount,
            price,
            orderType,
            side
        );
        console.log(`Gas estimate for creating order: ${gasEstimate.toString()}`);

        const gasLimit = gasEstimate.mul(120).div(100); // Add 20% to estimated gas

        const orderTx = await orderBook.createOrder(
            selectedTokenAsset,
            selectedPaymentAsset,
            amount,
            price,
            orderType,
            side,
            { gasLimit }
        );
        console.log(`Transaction hash: ${orderTx.hash}`);

        const receipt = await orderTx.wait();
        console.log(`Order created successfully in block ${receipt.blockNumber}`);

        // Extract the order ID from events
        let orderId: string | null = null;
        if (receipt.events) {
            for (const event of receipt.events) {
                if (event.event === 'OrderCreated' && event.args) {
                    orderId = event.args.orderId.toString();
                    break;
                }
            }
        }

        if (orderId) {
            console.log(`Order ID: ${orderId}`);

            // Fetch and display the created order
            const order = await orderBook.orders(orderId);
            console.log(`Order details:`);
            console.log(`  Trader: ${order.trader}`);
            console.log(`  Token asset: ${order.tokenAsset}`);
            console.log(`  Payment asset: ${order.paymentAsset}`);
            console.log(`  Side: ${order.side === OrderSide.BUY ? 'BUY' : 'SELL'}`);
            console.log(`  Type: ${order.orderType === OrderType.LIMIT ? 'LIMIT' : 'MARKET'}`);
            console.log(`  Price: ${ethers.utils.formatEther(order.price)}`);
            console.log(`  Amount: ${ethers.utils.formatEther(order.amount)}`);
            console.log(`  Filled: ${ethers.utils.formatEther(order.filled)}`);
            console.log(`  Status: ${OrderStatus[order.status]}`);

            const timestampNumber = order.timestamp.toNumber();
            const expiryNumber = order.expiry.toNumber();
            console.log(`  Timestamp: ${new Date(timestampNumber * 1000).toISOString()}`);
            console.log(`  Expiry: ${new Date(expiryNumber * 1000).toISOString()}`);
        } else {
            console.warn("Warning: Could not extract Order ID from transaction events.");
        }

        // Step 4: Check for the order in the user's order list
        console.log("\n------- Verifying Order in User Orders -------");
        const userOrders = await orderBook.getTraderOrders(wallet.address, 0, 10);
        console.log(`Found ${userOrders.length} orders for user`);

        if (userOrders.length > 0) {
            console.log("User orders confirmed");
            // Optional: Verify the specific order ID exists in the list
            const foundOrder = userOrders.some(id => id.toString() === orderId);
            if (orderId && foundOrder) {
                console.log(`  Order ${orderId} found in user's list.`);
            } else if (orderId) {
                console.warn(`  Warning: Order ${orderId} was not found in the first 10 user orders.`);
            }
        } else {
            console.log("Warning: No orders found for user after order creation");
        }

        // Finally check the pair's best prices
        console.log("\n------- Checking Pair's Best Prices -------");
        const [bestBuyPrice, bestSellPrice] = await orderBook.getBestPrices(
            selectedTokenAsset,
            selectedPaymentAsset
        );

        console.log(`Best buy price: ${ethers.utils.formatEther(bestBuyPrice)}`);
        console.log(`Best sell price: ${ethers.utils.formatEther(bestSellPrice)}`);

        console.log("\n========== ACTIVE PAIRS TEST COMPLETED SUCCESSFULLY ==========");
        return 0;

    } catch (error) {
        console.error("\n========== TEST FAILED ==========");
        // Use the enhanced error message function
        console.error("Error details:", getErrorMessage(error));
        // Log the full error object if more details are needed for debugging
        // console.error("Full error object:", error);
        return 1;
    }
}

// Execute the script
main()
    .then(exitCode => {
        console.log(`Exiting with code ${exitCode}`);
        process.exit(exitCode);
    })
    .catch(error => {
        console.error("Unhandled error:", getErrorMessage(error));
        // console.error("Full unhandled error object:", error);
        process.exit(1);
    });