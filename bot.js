// bot.js
const { ethers } = require("ethers");
const express = require("express");
require("dotenv").config({ path: "/root/.env" });

const app = express();
const port = 3000;

function isValidPrivateKey(key) {
  const re = /^0x[a-fA-F0-9]{64}$/;
  return re.test(key);
}

const botState = {
  lastBlock: null,
  walletAddress: null,
  balance: null,
  status: "Initialisation...",
};

(async () => {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const receiverAddress = process.env.RECEIVER_ADDRESS;

  if (!rpcUrl) {
    console.error("Erreur : La variable d'environnement RPC_URL est manquante.");
    process.exit(1);
  }
  if (!privateKey) {
    console.error("Erreur : La variable d'environnement PRIVATE_KEY est manquante.");
    process.exit(1);
  }
  if (!receiverAddress) {
    console.error("Erreur : La variable d'environnement RECEIVER_ADDRESS est manquante.");
    process.exit(1);
  }

  if (!isValidPrivateKey(privateKey)) {
    console.error(
      "Erreur : La clé privée n'est pas au format hexadécimal valide (0x suivi de 64 caractères hex)."
    );
    console.error(`Valeur reçue : ${privateKey}`);
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (err) {
    console.error("Erreur lors de la création du wallet :", err.message);
    process.exit(1);
  }

  botState.walletAddress = await wallet.getAddress();

  console.log(`Wallet créé avec succès : ${botState.walletAddress}`);

  const GAS_LIMIT = 21000n;
  const RESERVE = ethers.parseEther("0.001");

  async function getGasFees() {
    const feeData = await provider.getFeeData();

    const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? feeData.gasPrice;

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      throw new Error("Impossible de récupérer les frais de gas.");
    }

    return { maxFeePerGas, maxPriorityFeePerGas };
  }

  provider.on("block", async (blockNumber) => {
    try {
      botState.lastBlock = blockNumber;

      const balance = await provider.getBalance(botState.walletAddress);
      botState.balance = ethers.formatEther(balance);

      botState.status = "En ligne";

      console.log(`Block: ${blockNumber}`);
      console.log(`Wallet: ${botState.walletAddress}`);
      console.log(`Balance: ${botState.balance} ETH`);

      const { maxFeePerGas, maxPriorityFeePerGas } = await getGasFees();

      const estimatedGasCost = GAS_LIMIT * maxFeePerGas;

      console.log(`Frais de gas estimés: ${ethers.formatEther(estimatedGasCost)} ETH`);

      if (balance <= estimatedGasCost + RESERVE) {
        console.log("Solde insuffisant pour couvrir les frais de gas + réserve.");
        console.log("--------------------------------------------------------");
        return;
      }

      const sendAmount = balance - estimatedGasCost - RESERVE;

      console.log(`Envoi de ${ethers.formatEther(sendAmount)} ETH vers ${receiverAddress}`);

      const tx = await wallet.sendTransaction({
        to: receiverAddress,
        value: sendAmount,
        gasLimit: GAS_LIMIT,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      console.log(`Transaction envoyée: ${tx.hash}`);

      const receipt = await tx.wait(1);

      console.log(`Transaction confirmée au block ${receipt.blockNumber}`);
      console.log("--------------------------------------------------------");
    } catch (err) {
      botState.status = `Erreur détectée : ${err.message}`;
      console.error("Erreur détectée :", err.message);
    }
  });

  app.get("/status", (req, res) => {
    res.json(botState);
  });

  app.listen(port, () => {
    console.log(`Dashboard accessible sur http://localhost:${port}/status`);
  });
})();

