const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    publicKey: { type: String, required: true, unique: true },
    keyId: { type: String, required: true },
    maskedIp: { type: String, required: true },
    realIp: { type: String, required: true },
    deviceInfo: { type: String },
    lastLogin: { type: Date },
    usingVPN: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
