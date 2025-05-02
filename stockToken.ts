// stockToken.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { StockToken__factory } from './types/ethers-contracts';

// Load environment variables
dotenv.config();

// Define delay utility function to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

async function main() {
    try {
        console.log("========== SCRIPT STARTING ==========");

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

        // Connect to an existing StockToken
        const tokenAddress = process.env.STOCK_TOKEN_ADDRESS;

        if (!tokenAddress) {
            throw new Error("STOCK_TOKEN_ADDRESS not set in .env file");
        }
        console.log(`Token contract address: ${tokenAddress}`);

        // Check if contract exists at the specified address
        console.log("Checking if contract exists at the specified address...");
        const code = await provider.getCode(tokenAddress);

        if (code === '0x') {
            throw new Error("No contract exists at the specified address");
        }
        console.log(`Contract exists at address (bytecode size: ${(code.length - 2) / 2} bytes)`);

        // Create contract instance
        console.log("Creating contract instance...");
        const stockToken = StockToken__factory.connect(tokenAddress, wallet);
        console.log("Contract instance created");

        // Set variables to control which operations to perform
        const shouldPerformActiveOperations = true; // Set to true to enable state-changing operations

        // Test basic ERC20 functions
        console.log("\n------- Testing basic ERC20 functions -------");

        console.log("Calling name()...");
        const name = await stockToken.name();
        console.log(`Token name: ${name}`);

        console.log("Calling symbol()...");
        const symbol = await stockToken.symbol();
        console.log(`Token symbol: ${symbol}`);

        console.log("Calling decimals()...");
        const decimals = await stockToken.decimals();
        console.log(`Token decimals: ${decimals}`);

        console.log("Calling totalSupply()...");
        const totalSupply = await stockToken.totalSupply();
        console.log(`Total supply: ${ethers.utils.formatUnits(totalSupply, decimals)} ${symbol}`);

        console.log("Calling balanceOf()...");
        const balance = await stockToken.balanceOf(wallet.address);
        console.log(`Balance: ${ethers.utils.formatUnits(balance, decimals)} ${symbol}`);

        console.log("Basic ERC20 functions working correctly ✓");

        // Test stock-specific functions
        console.log("\n------- Testing stock-specific functions -------");

        console.log("Calling companyName()...");
        const companyName = await stockToken.companyName();
        console.log(`Company name: ${companyName}`);

        console.log("Calling ticker()...");
        const ticker = await stockToken.ticker();
        console.log(`Stock ticker: ${ticker}`);

        console.log("Calling companyDescription()...");
        const description = await stockToken.companyDescription();
        console.log(`Description: ${description}`);

        console.log("Calling maxSupply()...");
        const maxSupply = await stockToken.maxSupply();
        console.log(`Max supply: ${ethers.utils.formatUnits(maxSupply, decimals)} ${symbol}`);

        console.log("Calling isTradable()...");
        const isTradable = await stockToken.isTradable();
        console.log(`Tradable: ${isTradable ? 'Yes' : 'No'}`);

        // Check if wallet is contract owner for permission-controlled functions
        console.log("\n------- Testing active functions (these will modify state) -------");
        console.log("Checking if wallet is contract owner...");
        const contractOwner = await stockToken.owner();
        console.log(`Contract owner: ${contractOwner}`);
        console.log(`Is our wallet the owner? ${wallet.address === contractOwner ? 'Yes' : 'No'}`);

        if (!shouldPerformActiveOperations) {
            console.log("\nActive operations are disabled. Set shouldPerformActiveOperations = true to enable them.");
        } else {
            // Only perform these operations if explicitly enabled
            console.log("\nActive operations are enabled. Performing state-changing operations...");

            // 1. Mint tokens (if we're the owner)
            if (wallet.address === contractOwner) {
                try {
                    console.log("\n----- Minting tokens -----");
                    const mintAmount = ethers.utils.parseUnits("100", decimals);
                    console.log(`Attempting to mint ${ethers.utils.formatUnits(mintAmount, decimals)} ${symbol} tokens...`);

                    const mintTx = await stockToken.mint(wallet.address, mintAmount);
                    console.log(`Transaction hash: ${mintTx.hash}`);

                    const receipt = await mintTx.wait();
                    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

                    // Verify new balance and total supply
                    const newBalance = await stockToken.balanceOf(wallet.address);
                    console.log(`New balance: ${ethers.utils.formatUnits(newBalance, decimals)} ${symbol}`);

                    const newTotalSupply = await stockToken.totalSupply();
                    console.log(`New total supply: ${ethers.utils.formatUnits(newTotalSupply, decimals)} ${symbol}`);
                } catch (error) {
                    console.error("Error minting tokens:", getErrorMessage(error));
                }

                // Add delay between transactions to avoid rate limiting
                await delay(2000);
            }

            // 2. Update metadata (if we're the owner)
            if (wallet.address === contractOwner) {
                try {
                    console.log("\n----- Updating metadata -----");

                    // Store original values to restore later
                    const originalCompanyName = await stockToken.companyName();
                    const originalTicker = await stockToken.ticker();
                    const originalDescription = await stockToken.companyDescription();

                    // Update metadata
                    const newCompanyName = "Updated " + originalCompanyName;
                    const newTicker = "U" + originalTicker;
                    const newDescription = "Updated " + originalDescription;

                    console.log("Updating stock metadata...");
                    console.log(`New company name: ${newCompanyName}`);
                    console.log(`New ticker: ${newTicker}`);
                    console.log(`New description: ${newDescription}`);

                    const updateTx = await stockToken.updateMetadata(
                        newCompanyName,
                        newTicker,
                        newDescription
                    );

                    console.log(`Transaction hash: ${updateTx.hash}`);
                    const updateReceipt = await updateTx.wait();
                    console.log(`Transaction confirmed in block ${updateReceipt.blockNumber}`);

                    // Verify the update
                    const updatedCompanyName = await stockToken.companyName();
                    const updatedTicker = await stockToken.ticker();
                    const updatedDescription = await stockToken.companyDescription();

                    console.log("\nVerifying updated values:");
                    console.log(`Company name: ${updatedCompanyName}`);
                    console.log(`Ticker: ${updatedTicker}`);
                    console.log(`Description: ${updatedDescription}`);

                    // Add delay between transactions
                    await delay(2000);

                    // Restore original values
                    console.log("\nRestoring original metadata...");

                    const restoreTx = await stockToken.updateMetadata(
                        originalCompanyName,
                        originalTicker,
                        originalDescription
                    );

                    await restoreTx.wait();
                    console.log("Original metadata restored");
                } catch (error) {
                    console.error("Error updating metadata:", getErrorMessage(error));
                }

                // Add delay between transactions
                await delay(2000);
            }

            // 3. Toggle trading status (if we're the owner)
            if (wallet.address === contractOwner) {
                try {
                    console.log("\n----- Updating trading status -----");

                    // Get original status to restore later
                    const originalTradable = await stockToken.isTradable();

                    // Toggle the status
                    const newTradable = !originalTradable;
                    console.log(`Changing trading status from ${originalTradable ? 'enabled' : 'disabled'} to ${newTradable ? 'enabled' : 'disabled'}...`);

                    const tradableTx = await stockToken.setTradable(newTradable, {
                        maxFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
                        maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei")
                    });

                    console.log(`Transaction hash: ${tradableTx.hash}`);
                    const tradableReceipt = await tradableTx.wait();
                    console.log(`Transaction confirmed in block ${tradableReceipt.blockNumber}`);

                    // Verify the update
                    const updatedTradable = await stockToken.isTradable();
                    console.log(`Trading status after update: ${updatedTradable ? 'enabled' : 'disabled'}`);

                    // Add delay between transactions
                    await delay(2000);

                    // Restore original value
                    console.log("\nRestoring original trading status...");

                    const restoreTx = await stockToken.setTradable(originalTradable, {
                        maxFeePerGas: ethers.utils.parseUnits("2", "gwei"),
                        maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei")
                    });

                    await restoreTx.wait();
                    console.log("Original trading status restored");
                } catch (error) {
                    console.error("Error updating trading status:", getErrorMessage(error));
                }

                // Add delay between transactions
                await delay(2000);
            }

            // 4. Transfer tokens (if we have any)
            if (!balance.isZero()) {
                try {
                    console.log("\n----- Transferring tokens -----");

                    // Create a test address for transfer
                    const testAddress = ethers.Wallet.createRandom().address;
                    const transferAmount = ethers.utils.parseUnits("1", decimals);

                    console.log(`Transferring ${ethers.utils.formatUnits(transferAmount, decimals)} ${symbol} to ${testAddress}...`);

                    const transferTx = await stockToken.transfer(testAddress, transferAmount);
                    console.log(`Transaction hash: ${transferTx.hash}`);

                    const transferReceipt = await transferTx.wait();
                    console.log(`Transaction confirmed in block ${transferReceipt.blockNumber}`);

                    // Verify the transfer
                    const recipientBalance = await stockToken.balanceOf(testAddress);
                    console.log(`Recipient balance: ${ethers.utils.formatUnits(recipientBalance, decimals)} ${symbol}`);

                    const senderBalance = await stockToken.balanceOf(wallet.address);
                    console.log(`Sender balance: ${ethers.utils.formatUnits(senderBalance, decimals)} ${symbol}`);
                } catch (error) {
                    console.error("Error transferring tokens:", getErrorMessage(error));
                }
            } else {
                console.log("\nSkipping transfer: wallet has no tokens");
            }

            // 5. Set asset registry (if we're the owner)
            if (wallet.address === contractOwner) {
                try {
                    console.log("\n----- Setting asset registry -----");

                    // Get current registry address
                    let currentRegistry: string;
                    try {
                        currentRegistry = await stockToken.assetRegistry();
                        console.log(`Current asset registry: ${currentRegistry || 'Not set'}`);
                    } catch (error) {
                        console.log(`Could not get current registry: ${getErrorMessage(error)}`);
                        currentRegistry = ethers.constants.AddressZero;
                    }

                    // Create a mock address to set as registry
                    const mockRegistryAddress = ethers.utils.getAddress("0x000000000000000000000000000000000000dEaD");

                    console.log(`Setting asset registry to: ${mockRegistryAddress}...`);

                    const registryTx = await stockToken.setAssetRegistry(mockRegistryAddress);
                    console.log(`Transaction hash: ${registryTx.hash}`);

                    const registryReceipt = await registryTx.wait();
                    console.log(`Transaction confirmed in block ${registryReceipt.blockNumber}`);

                    // Verify the update
                    const newRegistry = await stockToken.assetRegistry();
                    console.log(`New asset registry: ${newRegistry}`);

                    // Restore the original registry if it was set
                    if (currentRegistry && currentRegistry !== ethers.constants.AddressZero) {
                        console.log("\nRestoring original asset registry...");

                        const restoreRegistryTx = await stockToken.setAssetRegistry(currentRegistry);
                        await restoreRegistryTx.wait();

                        console.log("Original asset registry restored");
                    }
                } catch (error) {
                    console.error("Error setting asset registry:", getErrorMessage(error));
                }
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