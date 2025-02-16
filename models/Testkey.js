const mongoose = require("mongoose");

// Define schema for storing public keys and their associated keyIds
const testKeySchema = new mongoose.Schema({
    keyId: { type: String, unique: true, required: true },
    publicKey: { type: String, unique: true, required: true },
    privateKey: { type: String, required: true }  // Used for signing messages
});

// Create & export the model
module.exports = mongoose.model("TestKey", testKeySchema, "test.keys");  // Specify custom collection name
