const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Folder to store user keys (ONLY server-side)
const KEY_STORAGE_DIR = path.join(__dirname, "keys");

// Ensure the folder exists
if (!fs.existsSync(KEY_STORAGE_DIR)) {
    fs.mkdirSync(KEY_STORAGE_DIR, { recursive: true });
}

/**
 * Generates a new key pair (Public & Private Key)
 * @returns {Object} { publicKey, privateKey }
 */
function generateKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    // Save private key securely in server storage (Not in DB)
    const keyId = crypto.randomBytes(16).toString("hex");
    const privateKeyPath = path.join(KEY_STORAGE_DIR, `${keyId}.pem`);
    fs.writeFileSync(privateKeyPath, privateKey);

    // ✅ Fix: Format Public Key for JSON output
    const formattedPublicKey = publicKey.replace(/\n/g, "\\n");

    return { publicKey: formattedPublicKey, keyId };
}


/**
 * Signs a message using the stored private key
 * @param {string} keyId - The identifier of the private key
 * @param {string} message - The message to sign
 * @returns {string} - The signed message
 */
function signMessage(keyId, message) {
    const privateKeyPath = path.join(KEY_STORAGE_DIR, `${keyId}.pem`);

    if (!fs.existsSync(privateKeyPath)) {
        throw new Error("Private key not found for this user");
    }

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    const sign = crypto.createSign("SHA256");
    sign.update(message);
    sign.end();

    return sign.sign(privateKey, "hex");
}

/**
 * Verifies a signed message using the public key
 * @param {string} publicKey - The public key
 * @param {string} message - The original message
 * @param {string} signature - The signed message
 * @returns {boolean} - True if valid, false otherwise
 */
function verifyMessage(publicKey, message, signature) {
    const verify = crypto.createVerify("SHA256");
    verify.update(message);
    verify.end();

    return verify.verify(publicKey, signature, "hex");
}

module.exports = { generateKeys, signMessage, verifyMessage };
