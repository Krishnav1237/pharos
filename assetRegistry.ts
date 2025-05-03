// assetRegistry.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { AssetRegistry__factory } from './types/ethers-contracts';

// Load environment variables
dotenv.config();

// Define delay utility function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Try to extract the revert reason from ethers error
        const message = error.message;

        // Handle specific case of asset not registered
        if (message.includes("execution reverted") && message.includes("4173736574206e6f742072656769737465726564")) {
            return "Asset not registered";
        }

        // Look for the revert reason in the error message
        const revertReasonMatch = message.match(/reason="([^"]+)"/);
        if (revertReasonMatch) {
            return revertReasonMatch[1];
        }

        return message;
    }
    return String(error);
}

async function main() {
    try {
        console.log("========== ASSET REGISTRY INTERACTION SCRIPT STARTING ==========");

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

        // Connect to an existing AssetRegistry
        const registryAddress = process.env.ASSET_REGISTRY_ADDRESS;

        if (!registryAddress) {
            throw new Error("ASSET_REGISTRY_ADDRESS not set in .env file");
        }
        console.log(`Asset Registry contract address: ${registryAddress}`);

        // Check if contract exists at the specified address
        console.log("Checking if contract exists at the specified address...");
        const code = await provider.getCode(registryAddress);

        if (code === '0x') {
            throw new Error("No contract exists at the specified address");
        }
        console.log(`Contract exists at address (bytecode size: ${(code.length - 2) / 2} bytes)`);

        // Create contract instance
        console.log("Creating contract instance...");
        const assetRegistry = AssetRegistry__factory.connect(registryAddress, wallet);
        console.log("Contract instance created");

        // Set variables to control which operations to perform
        const shouldPerformActiveOperations = true; // Enabled as requested

        // Test basic read functions
        console.log("\n------- Testing basic registry functions -------");

        // Get owner of the registry
        console.log("Calling owner()...");
        const registryOwner = await assetRegistry.owner();
        console.log(`Registry owner: ${registryOwner}`);

        // Check if the wallet is the owner
        const isOwner = registryOwner === wallet.address;
        console.log(`Is our wallet the owner? ${isOwner ? 'Yes' : 'No'}`);

        // Get admin roles if available
        try {
            console.log("Checking if registry has role-based access control...");
            const adminRole = await assetRegistry.DEFAULT_ADMIN_ROLE();
            console.log(`DEFAULT_ADMIN_ROLE: ${adminRole}`);

            const hasAdminRole = await assetRegistry.hasRole(adminRole, wallet.address);
            console.log(`Does our wallet have admin role? ${hasAdminRole ? 'Yes' : 'No'}`);

            // Check for asset manager role
            const assetManagerRole = await assetRegistry.ASSET_MANAGER_ROLE();
            console.log(`ASSET_MANAGER_ROLE: ${assetManagerRole}`);

            const hasAssetManagerRole = await assetRegistry.hasRole(assetManagerRole, wallet.address);
            console.log(`Does our wallet have asset manager role? ${hasAssetManagerRole ? 'Yes' : 'No'}`);
        } catch (error) {
            console.log("This contract does not use AccessControl pattern.");
        }

        // Get total registered assets
        try {
            console.log("Calling getAssetCount()...");
            const assetCount = await assetRegistry.getAssetCount();
            console.log(`Total registered assets: ${assetCount.toString()}`);

            // Get list of asset addresses if count is reasonable
            if (assetCount.lte(20)) {
                console.log("\nListing all registered assets:");
                for (let i = 0; i < assetCount.toNumber(); i++) {
                    console.log(`Getting asset at index ${i}...`);
                    try {
                        // Try to get asset address using assetAddresses array
                        const assetAddress = await assetRegistry.assetAddresses(i);
                        console.log(`Asset ${i}: ${assetAddress}`);

                        try {
                            // Get detailed asset info
                            const assetInfo = await assetRegistry.getAsset(assetAddress);
                            console.log(`  Asset name: ${assetInfo.name}`);
                            console.log(`  Asset symbol: ${assetInfo.symbol}`);
                            console.log(`  Asset type: ${assetInfo.assetType}`);
                            console.log(`  Active: ${assetInfo.isActive ? 'Yes' : 'No'}`);
                            console.log(`  Registration time: ${new Date(assetInfo.registrationTime.toNumber() * 1000).toISOString()}`);
                        } catch (infoError) {
                            console.log(`  Unable to get asset details: ${getErrorMessage(infoError)}`);
                        }
                    } catch (error) {
                        // Try alternative method
                        try {
                            const assetData = await assetRegistry.getAssetByIndex(i);
                            console.log(`Asset ${i}: ${assetData.assetAddress}`);
                            console.log(`  Asset name: ${assetData.name}`);
                            console.log(`  Asset symbol: ${assetData.symbol}`);
                            console.log(`  Asset type: ${assetData.assetType}`);
                            console.log(`  Active: ${assetData.isActive ? 'Yes' : 'No'}`);
                        } catch (altError) {
                            console.log(`  Error getting asset at index ${i}: ${getErrorMessage(error)}`);
                        }
                    }
                }
            } else {
                console.log(`Asset count (${assetCount.toString()}) is too large to list all assets.`);
            }
        } catch (error) {
            console.log(`Error getting asset count: ${getErrorMessage(error)}`);
            console.log("This contract may use a different method to track assets.");
        }

        // Check if specific assets are registered
        console.log("\n------- Checking specific assets -------");

        // Check stock token
        const stockTokenAddress = process.env.STOCK_TOKEN_ADDRESS;
        if (stockTokenAddress) {
            try {
                console.log(`Checking if stock token (${stockTokenAddress}) is registered...`);

                try {
                    // Try to get asset information - this will throw if not registered
                    const assetInfo = await assetRegistry.getAsset(stockTokenAddress);
                    console.log(`Stock token is registered`);
                    console.log("Asset details:");
                    console.log(`  Name: ${assetInfo.name}`);
                    console.log(`  Symbol: ${assetInfo.symbol}`);
                    console.log(`  Asset type: ${assetInfo.assetType}`);
                    console.log(`  Active: ${assetInfo.isActive ? 'Yes' : 'No'}`);
                    console.log(`  Registration time: ${new Date(assetInfo.registrationTime.toNumber() * 1000).toISOString()}`);
                } catch (error) {
                    const errorMsg = getErrorMessage(error);
                    if (errorMsg === "Asset not registered") {
                        console.log(`Stock token is not registered`);
                    } else {
                        console.log(`Error checking asset: ${errorMsg}`);
                    }
                }
            } catch (error) {
                console.log(`Error checking stock token: ${getErrorMessage(error)}`);
            }
        }

        // Check commodity token
        const commodityTokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
        if (commodityTokenAddress) {
            try {
                console.log(`\nChecking if commodity token (${commodityTokenAddress}) is registered...`);

                try {
                    // Try to get asset information - this will throw if not registered
                    const assetInfo = await assetRegistry.getAsset(commodityTokenAddress);
                    console.log(`Commodity token is registered`);
                    console.log("Asset details:");
                    console.log(`  Name: ${assetInfo.name}`);
                    console.log(`  Symbol: ${assetInfo.symbol}`);
                    console.log(`  Asset type: ${assetInfo.assetType}`);
                    console.log(`  Active: ${assetInfo.isActive ? 'Yes' : 'No'}`);
                    console.log(`  Registration time: ${new Date(assetInfo.registrationTime.toNumber() * 1000).toISOString()}`);
                } catch (error) {
                    const errorMsg = getErrorMessage(error);
                    if (errorMsg === "Asset not registered") {
                        console.log(`Commodity token is not registered`);
                    } else {
                        console.log(`Error checking asset: ${errorMsg}`);
                    }
                }
            } catch (error) {
                console.log(`Error checking commodity token: ${getErrorMessage(error)}`);
            }
        }

        // Active operations - now enabled
        if (!shouldPerformActiveOperations) {
            console.log("\nActive operations are disabled. Set shouldPerformActiveOperations = true to enable them.");
        } else {
            console.log("\n------- Performing state-changing operations -------");

            // Only proceed if we have appropriate permissions
            let hasAssetManagerRole = false;
            try {
                const assetManagerRole = await assetRegistry.ASSET_MANAGER_ROLE();
                hasAssetManagerRole = await assetRegistry.hasRole(assetManagerRole, wallet.address);
            } catch (error) {
                console.log("Could not check asset manager role");
            }

            if (isOwner || hasAssetManagerRole) {
                // 1. Register stock token if not already registered
                if (stockTokenAddress) {
                    try {
                        console.log("\n----- Registering stock token -----");
                        console.log(`Checking if stock token (${stockTokenAddress}) is already registered...`);

                        // Check if already registered first
                        let isRegistered = false;
                        try {
                            await assetRegistry.getAsset(stockTokenAddress);
                            isRegistered = true;
                            console.log("Stock token is already registered, skipping registration");
                        } catch (error) {
                            const errorMsg = getErrorMessage(error);
                            if (errorMsg === "Asset not registered") {
                                console.log("Stock token is not registered, proceeding with registration");
                            } else {
                                console.log(`Error checking registration: ${errorMsg}`);
                                isRegistered = true; // Skip registration on error
                            }
                        }

                        if (!isRegistered) {
                            console.log(`Registering stock token at address: ${stockTokenAddress}`);
                            try {
                                // Try registerAsset with AssetType.STOCK (which is 0 based on the enum)
                                const tx = await assetRegistry.registerAsset(
                                    stockTokenAddress,
                                    0, // AssetType.STOCK
                                    true // isActive
                                );
                                console.log(`Transaction hash: ${tx.hash}`);
                                await tx.wait();
                                console.log("Stock token registered successfully");
                            } catch (error) {
                                console.log(`Failed to register stock token: ${getErrorMessage(error)}`);
                            }
                        }

                        // Add delay between transactions
                        await delay(2000);
                    } catch (error) {
                        console.error("Error registering stock token:", getErrorMessage(error));
                    }
                } else {
                    console.log("\n----- Registering stock token -----");
                    console.log("STOCK_TOKEN_ADDRESS not set in .env file, skipping registration");
                }

                // 2. Register commodity token if not already registered
                if (commodityTokenAddress) {
                    try {
                        console.log("\n----- Registering commodity token -----");
                        console.log(`Checking if commodity token (${commodityTokenAddress}) is already registered...`);

                        // Check if already registered first
                        let isRegistered = false;
                        try {
                            await assetRegistry.getAsset(commodityTokenAddress);
                            isRegistered = true;
                            console.log("Commodity token is already registered, skipping registration");
                        } catch (error) {
                            const errorMsg = getErrorMessage(error);
                            if (errorMsg === "Asset not registered") {
                                console.log("Commodity token is not registered, proceeding with registration");
                            } else {
                                console.log(`Error checking registration: ${errorMsg}`);
                                isRegistered = true; // Skip registration on error
                            }
                        }

                        if (!isRegistered) {
                            console.log(`Registering commodity token at address: ${commodityTokenAddress}`);
                            try {
                                // Try registerAsset with AssetType.COMMODITY (which is 1 based on the enum)
                                const tx = await assetRegistry.registerAsset(
                                    commodityTokenAddress,
                                    1, // AssetType.COMMODITY
                                    true // isActive
                                );
                                console.log(`Transaction hash: ${tx.hash}`);
                                await tx.wait();
                                console.log("Commodity token registered successfully");

                                // For CommodityToken, also set the assetRegistry in the token itself if applicable
                                try {
                                    // Try to import the CommodityToken contract factory
                                    const { CommodityToken__factory } = require('./types/ethers-contracts');
                                    const commodityToken = CommodityToken__factory.connect(commodityTokenAddress, wallet);

                                    // Check if the commodity token has the setAssetRegistry method
                                    if (typeof commodityToken.setAssetRegistry === 'function') {
                                        console.log("Updating asset registry in the commodity token...");
                                        const setTx = await commodityToken.setAssetRegistry(registryAddress);
                                        await setTx.wait();
                                        console.log("Asset registry set in commodity token successfully");
                                    }
                                } catch (innerError) {
                                    console.log(`Note: Couldn't set asset registry in commodity token: ${getErrorMessage(innerError)}`);
                                    console.log("This might be normal if the token doesn't support this function or isn't a CommodityToken");
                                }
                            } catch (error) {
                                console.log(`Failed to register commodity token: ${getErrorMessage(error)}`);
                            }
                        }

                        // Add delay between transactions
                        await delay(2000);
                    } catch (error) {
                        console.error("Error registering commodity token:", getErrorMessage(error));
                    }
                } else {
                    console.log("\n----- Registering commodity token -----");
                    console.log("COMMODITY_TOKEN_ADDRESS not set in .env file, skipping registration");
                }

                // 3. Register test token (if different from stock and commodity)
                const testTokenAddress = process.env.TEST_TOKEN_ADDRESS;
                if (testTokenAddress) {
                    try {
                        console.log("\n----- Registering test token -----");

                        // Check if test token is the same as stock or commodity token
                        if (
                            (stockTokenAddress && testTokenAddress === stockTokenAddress) ||
                            (commodityTokenAddress && testTokenAddress === commodityTokenAddress)
                        ) {
                            console.log("TEST_TOKEN_ADDRESS is same as STOCK_TOKEN_ADDRESS or COMMODITY_TOKEN_ADDRESS, skipping duplicate registration");
                        } else {
                            console.log(`Checking if test token (${testTokenAddress}) is already registered...`);

                            // Check if already registered first
                            let isRegistered = false;
                            try {
                                await assetRegistry.getAsset(testTokenAddress);
                                isRegistered = true;
                                console.log("Test token is already registered, skipping registration");
                            } catch (error) {
                                const errorMsg = getErrorMessage(error);
                                if (errorMsg === "Asset not registered") {
                                    console.log("Test token is not registered, proceeding with registration");
                                } else {
                                    console.log(`Error checking registration: ${errorMsg}`);
                                    isRegistered = true; // Skip registration on error
                                }
                            }

                            if (!isRegistered) {
                                console.log(`Registering test token at address: ${testTokenAddress}`);
                                // Try different registration methods based on the contract
                                let registered = false;

                                try {
                                    // Try registerAsset with AssetType.STOCK (which is 0 based on the enum)
                                    const tx = await assetRegistry.registerAsset(
                                        testTokenAddress,
                                        0, // AssetType.STOCK
                                        true // isActive
                                    );
                                    console.log(`Transaction hash: ${tx.hash}`);
                                    await tx.wait();
                                    console.log("Test token registered successfully as a STOCK token");
                                    registered = true;
                                } catch (error) {
                                    console.log(`Stock registration failed: ${getErrorMessage(error)}`);
                                    console.log("Trying payment token registration...");
                                }

                                if (!registered) {
                                    try {
                                        // Try registerPaymentToken method
                                        const tx = await assetRegistry.registerPaymentToken(
                                            testTokenAddress,
                                            "Test Payment Token", // These might be ignored if the contract reads from token
                                            "TPT",
                                            true // isActive
                                        );
                                        console.log(`Transaction hash: ${tx.hash}`);
                                        await tx.wait();
                                        console.log("Test token registered successfully as a PAYMENT token");
                                        registered = true;
                                    } catch (error) {
                                        console.log(`Payment token registration failed: ${getErrorMessage(error)}`);
                                    }
                                }

                                if (!registered) {
                                    console.log("All registration attempts failed. Check contract permissions and token compatibility.");
                                }
                            }
                        }

                        // Add delay between transactions
                        await delay(2000);
                    } catch (error) {
                        console.error("Error registering test token:", getErrorMessage(error));
                    }
                } else {
                    console.log("\n----- Registering test token -----");
                    console.log("TEST_TOKEN_ADDRESS not set in .env file, skipping registration");
                }

                // 4. Update asset status for all registered tokens
                try {
                    console.log("\n----- Updating asset statuses -----");

                    // Collect all token addresses that might be registered (removing undefined)
                    const tokensToCheck = [
                        stockTokenAddress,
                        commodityTokenAddress,
                        testTokenAddress
                    ].filter(addr => addr !== undefined) as string[];

                    // Remove duplicates
                    const uniqueTokenAddresses = [...new Set(tokensToCheck)];

                    for (const tokenAddress of uniqueTokenAddresses) {
                        console.log(`\nChecking status for token: ${tokenAddress}`);

                        // Check if registered first
                        let isRegistered = false;
                        let currentStatus = false;

                        try {
                            const assetInfo = await assetRegistry.getAsset(tokenAddress);
                            isRegistered = true;
                            currentStatus = assetInfo.isActive;
                            console.log(`Current status: ${currentStatus ? 'active' : 'inactive'}`);
                        } catch (error) {
                            const errorMsg = getErrorMessage(error);
                            if (errorMsg === "Asset not registered") {
                                console.log("Token is not registered, skipping update");
                            } else {
                                console.log(`Error checking registration: ${errorMsg}`);
                            }
                        }

                        if (isRegistered) {
                            // Toggle status
                            const newStatus = !currentStatus;

                            try {
                                const tx = await assetRegistry.setAssetStatus(tokenAddress, newStatus);
                                console.log(`Transaction hash: ${tx.hash}`);
                                await tx.wait();
                                console.log(`Asset status updated to: ${newStatus ? 'active' : 'inactive'}`);

                                // Add delay before restoring
                                await delay(2000);

                                // Restore original status
                                const restoreTx = await assetRegistry.setAssetStatus(tokenAddress, currentStatus);
                                await restoreTx.wait();
                                console.log("Original status restored");
                            } catch (error) {
                                console.log(`Failed to update asset status: ${getErrorMessage(error)}`);
                            }

                            // Add delay between tokens
                            await delay(2000);
                        }
                    }
                } catch (error) {
                    console.error("Error updating asset statuses:", getErrorMessage(error));
                }
            } else {
                console.log("Wallet does not have appropriate permissions for state-changing operations");
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