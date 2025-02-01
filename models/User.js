const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    publicKey: { type: String, required: true },  // Public key of the user (blockchain key)
    ip: { type: String, required: true },  // User's IP address
    deviceInfo: { type: String },  // Browser and OS information
    timestamp: { type: Date, default: Date.now }  // Store login timestamp automatically
});

// Export User model
module.exports = mongoose.model("User", UserSchema);
