// testCommodityToken.ts
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { CommodityToken__factory } from './types/ethers-contracts';

// Load environment variables
dotenv.config();

async function main() {
    try {
        console.log("========== COMMODITY TOKEN TEST SCRIPT ==========");

        // Setup provider
        const rpcUrl = process.env.PHAROS_RPC_URL;
        if (!rpcUrl) {
            throw new Error("PHAROS_RPC_URL not set in .env file");
        }
        console.log(`RPC URL: ${rpcUrl}`);

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name || 'custom'} (chainId: ${network.chainId})`);

        // Setup wallet
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY not set in .env file");
        }
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`Connected with wallet address: ${wallet.address}`);

        const ethBalance = await provider.getBalance(wallet.address);
        console.log(`Wallet ETH balance: ${ethers.utils.formatEther(ethBalance)} ETH`);

        // Setup test accounts
        const testPrivateKey = ethers.Wallet.createRandom().privateKey;
        const testWallet = new ethers.Wallet(testPrivateKey, provider);
        console.log(`Created test wallet: ${testWallet.address}`);

        // Connect to token contract
        const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
        if (!tokenAddress) {
            throw new Error("TOKEN_CONTRACT_ADDRESS not set in .env file");
        }
        console.log(`Token contract address: ${tokenAddress}`);

        const commodityToken = CommodityToken__factory.connect(tokenAddress, wallet);
        console.log("Contract instance created");

        // ==================== READ-ONLY FUNCTIONS ====================
        console.log("\n---------- Testing Read-Only Functions ----------");

        // Basic ERC20 functions
        console.log("\n----- Basic ERC20 Information -----");
        const name = await commodityToken.name();
        const symbol = await commodityToken.symbol();
        const decimals = await commodityToken.decimals();
        const totalSupply = await commodityToken.totalSupply();

        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        console.log(`Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)} ${symbol}`);

        // Balances
        console.log("\n----- Account Balances -----");
        const ownerBalance = await commodityToken.balanceOf(wallet.address);
        console.log(`Owner balance: ${ethers.utils.formatUnits(ownerBalance, decimals)} ${symbol}`);

        // Commodity-specific functions
        console.log("\n----- Commodity Metadata -----");
        const commodityName = await commodityToken.commodityName();
        const commoditySymbol = await commodityToken.commoditySymbol();
        const description = await commodityToken.commodityDescription();
        const category = await commodityToken.commodityCategory();

        console.log(`Commodity name: ${commodityName}`);
        console.log(`Commodity symbol: ${commoditySymbol}`);
        console.log(`Description: ${description}`);
        console.log(`Category: ${category}`);

        // Token status
        console.log("\n----- Token Status -----");
        const tradable = await commodityToken.isTradable();
        const owner = await commodityToken.owner();

        console.log(`Is tradable: ${tradable ? 'Yes' : 'No'}`);
        console.log(`Contract owner: ${owner}`);
        console.log(`Is wallet the owner? ${wallet.address.toLowerCase() === owner.toLowerCase() ? 'Yes' : 'No'}`);

        // ==================== STATE-MODIFYING FUNCTIONS ====================
        console.log("\n---------- Testing State-Modifying Functions ----------");

        // Enable/disable state-changing operations
        const enableMint = true;
        const enableTransfer = true;
        const enableMetadataUpdate = true;
        const enableTradingUpdate = true;
        const enableApproval = true;
        const enableTransferFrom = true;
        const enableOwnershipTransfer = false; // Be careful with this one!

        // 1. Mint tokens
        if (enableMint) {
            console.log("\n----- Testing mint() -----");
            const mintAmount = ethers.utils.parseUnits("10", decimals);

            console.log(`Minting ${ethers.utils.formatUnits(mintAmount, decimals)} ${symbol} tokens to ${wallet.address}...`);

            try {
                const mintTx = await commodityToken.mint(wallet.address, mintAmount);
                console.log(`Transaction hash: ${mintTx.hash}`);

                const mintReceipt = await mintTx.wait();
                console.log(`Transaction confirmed in block ${mintReceipt.blockNumber}`);

                // Check updated balance
                const newBalance = await commodityToken.balanceOf(wallet.address);
                console.log(`Updated balance: ${ethers.utils.formatUnits(newBalance, decimals)} ${symbol}`);

                // Check total supply change
                const newTotalSupply = await commodityToken.totalSupply();
                console.log(`Updated total supply: ${ethers.utils.formatUnits(newTotalSupply, decimals)} ${symbol}`);
            } catch (error) {
                console.error("ERROR: Mint operation failed");
                console.error(error);
            }
        }

        // 2. Transfer tokens
        if (enableTransfer) {
            console.log("\n----- Testing transfer() -----");
            const transferAmount = ethers.utils.parseUnits("1", decimals);

            console.log(`Transferring ${ethers.utils.formatUnits(transferAmount, decimals)} ${symbol} tokens to ${testWallet.address}...`);

            try {
                const beforeBalance = await commodityToken.balanceOf(testWallet.address);
                console.log(`Recipient balance before: ${ethers.utils.formatUnits(beforeBalance, decimals)} ${symbol}`);

                const transferTx = await commodityToken.transfer(testWallet.address, transferAmount);
                console.log(`Transaction hash: ${transferTx.hash}`);

                const transferReceipt = await transferTx.wait();
                console.log(`Transaction confirmed in block ${transferReceipt.blockNumber}`);

                // Check updated balances
                const afterBalance = await commodityToken.balanceOf(testWallet.address);
                console.log(`Recipient balance after: ${ethers.utils.formatUnits(afterBalance, decimals)} ${symbol}`);

                const senderBalance = await commodityToken.balanceOf(wallet.address);
                console.log(`Sender balance after: ${ethers.utils.formatUnits(senderBalance, decimals)} ${symbol}`);
            } catch (error) {
                console.error("ERROR: Transfer operation failed");
                console.error(error);
            }
        }

        // 3. Approval and TransferFrom
        if (enableApproval) {
            console.log("\n----- Testing approve() -----");
            const approvalAmount = ethers.utils.parseUnits("2", decimals);

            console.log(`Approving ${ethers.utils.formatUnits(approvalAmount, decimals)} ${symbol} tokens for spender ${testWallet.address}...`);

            try {
                const approveTx = await commodityToken.approve(testWallet.address, approvalAmount);
                console.log(`Transaction hash: ${approveTx.hash}`);

                const approveReceipt = await approveTx.wait();
                console.log(`Transaction confirmed in block ${approveReceipt.blockNumber}`);

                // Check allowance
                const allowance = await commodityToken.allowance(wallet.address, testWallet.address);
                console.log(`Allowance after approval: ${ethers.utils.formatUnits(allowance, decimals)} ${symbol}`);

                // Test transferFrom if enabled
                if (enableTransferFrom) {
                    console.log("\n----- Testing transferFrom() -----");
                    console.log("Connecting with test wallet to test transferFrom...");

                    // Connect to token contract with test wallet
                    const tokenWithTestWallet = CommodityToken__factory.connect(tokenAddress, testWallet);

                    const transferFromAmount = ethers.utils.parseUnits("0.5", decimals);
                    console.log(`Test wallet transferring ${ethers.utils.formatUnits(transferFromAmount, decimals)} ${symbol} tokens from ${wallet.address} to itself...`);

                    const transferFromTx = await tokenWithTestWallet.transferFrom(
                        wallet.address,
                        testWallet.address,
                        transferFromAmount
                    );
                    console.log(`Transaction hash: ${transferFromTx.hash}`);

                    const transferFromReceipt = await transferFromTx.wait();
                    console.log(`Transaction confirmed in block ${transferFromReceipt.blockNumber}`);

                    // Check updated allowance
                    const newAllowance = await commodityToken.allowance(wallet.address, testWallet.address);
                    console.log(`Allowance after transferFrom: ${ethers.utils.formatUnits(newAllowance, decimals)} ${symbol}`);

                    // Check updated balances
                    const testWalletBalance = await commodityToken.balanceOf(testWallet.address);
                    console.log(`Test wallet balance after transferFrom: ${ethers.utils.formatUnits(testWalletBalance, decimals)} ${symbol}`);
                }
            } catch (error) {
                console.error("ERROR: Approval operation failed");
                console.error(error);
            }
        }

        // 4. Update commodity metadata
        if (enableMetadataUpdate) {
            console.log("\n----- Testing updateMetadata() -----");

            // Store original values to restore later
            const originalCommodityName = await commodityToken.commodityName();
            const originalCommoditySymbol = await commodityToken.commoditySymbol();
            const originalDescription = await commodityToken.commodityDescription();

            const newCommodityName = "Updated Gold Bullion";
            const newCommoditySymbol = "XGLD";
            const newDescription = "Updated tokenized representation of 1 troy ounce of 99.99% pure gold";

            console.log(`Updating commodity metadata...`);
            console.log(`New name: ${newCommodityName}`);
            console.log(`New symbol: ${newCommoditySymbol}`);
            console.log(`New description: ${newDescription}`);

            try {
                const updateTx = await commodityToken.updateMetadata(
                    newCommodityName,
                    newCommoditySymbol,
                    newDescription
                );
                console.log(`Transaction hash: ${updateTx.hash}`);

                const updateReceipt = await updateTx.wait();
                console.log(`Transaction confirmed in block ${updateReceipt.blockNumber}`);

                // Verify the update
                const updatedCommodityName = await commodityToken.commodityName();
                const updatedCommoditySymbol = await commodityToken.commoditySymbol();
                const updatedDescription = await commodityToken.commodityDescription();

                console.log(`\nVerifying updated values:`);
                console.log(`Commodity name: ${updatedCommodityName}`);
                console.log(`Commodity symbol: ${updatedCommoditySymbol}`);
                console.log(`Description: ${updatedDescription}`);

                // Restore original values
                console.log(`\nRestoring original metadata...`);

                const restoreTx = await commodityToken.updateMetadata(
                    originalCommodityName,
                    originalCommoditySymbol,
                    originalDescription
                );

                await restoreTx.wait();

                console.log(`Original metadata restored.`);
            } catch (error) {
                console.error("ERROR: Metadata update operation failed");
                console.error(error);
            }
        }

        // 5. Update tradable status
        if (enableTradingUpdate) {
            console.log("\n----- Testing setTradable() -----");

            // Store original value to restore later
            const originalTradable = await commodityToken.isTradable();

            // Toggle the tradable status
            const newTradable = !originalTradable;
            console.log(`Changing tradable status from ${originalTradable ? 'enabled' : 'disabled'} to ${newTradable ? 'enabled' : 'disabled'}...`);

            try {
                const tradableTx = await commodityToken.setTradable(newTradable);
                console.log(`Transaction hash: ${tradableTx.hash}`);

                const tradableReceipt = await tradableTx.wait();
                console.log(`Transaction confirmed in block ${tradableReceipt.blockNumber}`);

                // Verify the update
                const updatedTradable = await commodityToken.isTradable();
                console.log(`Tradable status after update: ${updatedTradable ? 'enabled' : 'disabled'}`);

                // Restore original value
                console.log(`\nRestoring original tradable status...`);

                const restoreTx = await commodityToken.setTradable(originalTradable);
                await restoreTx.wait();

                console.log(`Original tradable status restored.`);
            } catch (error) {
                console.error("ERROR: Tradable status update operation failed");
                console.error(error);
            }
        }

        // 6. Transfer ownership
        if (enableOwnershipTransfer) {
            console.log("\n----- Testing transferOwnership() -----");
            console.log("WARNING: This will transfer contract ownership to another address!");
            console.log("Make sure you know what you're doing!");

            console.log(`Current owner: ${await commodityToken.owner()}`);
            console.log(`Transferring ownership to test wallet: ${testWallet.address}...`);

            try {
                const transferOwnershipTx = await commodityToken.transferOwnership(testWallet.address);
                console.log(`Transaction hash: ${transferOwnershipTx.hash}`);

                const transferOwnershipReceipt = await transferOwnershipTx.wait();
                console.log(`Transaction confirmed in block ${transferOwnershipReceipt.blockNumber}`);

                // Verify the update
                const newOwner = await commodityToken.owner();
                console.log(`New owner: ${newOwner}`);

                if (newOwner.toLowerCase() === testWallet.address.toLowerCase()) {
                    console.log(`\nTransferring ownership back to original wallet...`);

                    // Connect with test wallet to transfer ownership back
                    const tokenWithTestWallet = CommodityToken__factory.connect(tokenAddress, testWallet);

                    const transferBackTx = await tokenWithTestWallet.transferOwnership(wallet.address);
                    await transferBackTx.wait();

                    const finalOwner = await commodityToken.owner();
                    console.log(`Ownership transferred back. Current owner: ${finalOwner}`);
                }
            } catch (error) {
                console.error("ERROR: Ownership transfer operation failed");
                console.error(error);
            }
        }

        console.log("\n========== TESTING COMPLETED SUCCESSFULLY ==========");

    } catch (error) {
        console.error('\n========== TESTING FAILED ==========');
        console.error('Error details:');
        console.error(error);
    }
}

// Run the script
main()
    .then(() => {
        console.log("Exiting with success code 0");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Unhandled error:", error);
        console.log("Exiting with error code 1");
        process.exit(1);
    });