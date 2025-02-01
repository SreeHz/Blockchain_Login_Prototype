const ethers = require("ethers");

// Generate a new wallet (key pair)
const wallet = ethers.Wallet.createRandom();

console.log("Public Key (Wallet Address):", wallet.address);
console.log("Private Key:", wallet.privateKey);

