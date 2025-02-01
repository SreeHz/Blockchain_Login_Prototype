const ethers = require("ethers");
require("dotenv").config();

// Replace with the private key you generated in Step 3.4
const privateKey = "0x8fea270c4a7217aee9b8f02ee3699b4b0a956438ea03a206b2bcd37a2521e9c6"; 

// Create a wallet instance
const wallet = new ethers.Wallet(privateKey);

// Message to sign (this will be used to verify login)
const message = "Login to our app";

async function signMessage() {
    const signature = await wallet.signMessage(message);
    console.log("Signed Message:", signature);
}

signMessage();
