// bot.js
const { ethers } = require("ethers");
require("dotenv").config();

// Configuration
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const receiverAddress = process.env.RECEIVER_ADDRESS;

// Parameters
const GAS_LIMIT = 21000n; // standard for ETH transfer
const RESERVE = ethers.parseEther("0.001"); // minimal reserve to keep in wallet

async function getGasFees() {
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? feeData.gasPrice;

  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    throw new Error("Unable to fetch gas fees.");
  }
  return { maxFeePerGas, maxPriorityFeePerGas };
}

provider.on("block", async (blockNumber) => {
  try {
    console.log(`Block: ${blockNumber}`);
    const address = await wallet.getAddress();
    const balance = await provider.getBalance(address);

    console.log(`Wallet: ${address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    const { maxFeePerGas, maxPriorityFeePerGas } = await getGasFees();
    const estimatedGasCost = GAS_LIMIT * maxFeePerGas;
    console.log(`Estimated Gas Fees: ${ethers.formatEther(estimatedGasCost)} ETH`);

    if (balance <= estimatedGasCost + RESERVE) {
      console.log("Not enough balance to cover gas fees + reserve.");
      console.log("--------------------------------------------------------");
      return;
    }

    const sendAmount = balance - estimatedGasCost - RESERVE;
    console.log(`Sending ${ethers.formatEther(sendAmount)} ETH to ${receiverAddress}`);

    const tx = await wallet.sendTransaction({
      to: receiverAddress,
      value: sendAmount,
      gasLimit: GAS_LIMIT,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait(1);
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log("--------------------------------------------------------");

  } catch (err) {
    console.error("Error:", err.message);
  }
});