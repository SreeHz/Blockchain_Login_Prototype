const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    publicKey: { type: String, required: true, unique: true },  // User's public key
    keyId: { type: String, required: true, unique: true },  // Reference to private key (stored on server)
    ip: { type: String, default: "Not logged in yet" },  // Last login IP address
    deviceInfo: { type: String, default: "Not logged in yet" },  // Last login device info
    lastLogin: { type: Date, default: Date.now }  // Timestamp of last login
});

module.exports = mongoose.model("User", UserSchema);
