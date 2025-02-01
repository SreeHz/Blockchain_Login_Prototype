const ethers = require("ethers");

// Message that was signed
const message = "Login to our app";

// Replace with the actual signed message from Step 3.5
const signedMessage = "0x40e46a3b1855b91e39695ad664944aaa63a177e79144256f819f8af8250744554c53cc4b494cbf92597e83e1cf36799649f99a5b25648c4d83e248e8a1d083ee1c";

// Replace with the public key (wallet address) from Step 3.4
const publicKey = "0x210c43cD9a8ddCbEabacACb5fA202dBfcB1776E6";

async function verifySignature() {
    
    const recoveredAddress = ethers.verifyMessage(message, signedMessage);
    
    if (recoveredAddress === publicKey) {
        console.log("✅ Signature is valid! User is authenticated.");
    } else {
        console.log("❌ Invalid signature. Authentication failed.");
    }
}

verifySignature();
