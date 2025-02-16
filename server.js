require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const ethers = require("ethers");
const cors = require("cors");
const fs = require("fs"); // For reading predefined keys
const TestKey = require("./models/Testkey"); // Import the new TestKey model
const User = require("./models/User"); // Import User model

const app = express();
const PORT = process.env.PORT || 5000;

// Load Predefined Keys from JSON (Simulating a Fixed Key Storage System)
const keysData = JSON.parse(fs.readFileSync("keys.json", "utf8"));

// CORS setup for production (Render) and development (localhost)
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? "https://blockchain-login-prototype.onrender.com" // Allow only your frontend URL in production
        : "http://localhost:5173",  // Allow localhost for development
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true  // Allow credentials (if needed)
};

// Middleware
app.use(cors(corsOptions));  // Use CORS for handling cross-origin requests
app.use(bodyParser.json());  // Parse incoming JSON requests
app.use(requestIp.mw());  // Capture IP addresses from requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));


// 🚀 **Generate Wallet Endpoint**
app.post("/generate-wallet", async (req, res) => {
    try {
        const { publicKey } = req.body;

        if (!publicKey) {
            return res.status(400).json({ error: "Missing publicKey" });
        }

        // 🔍 Check if the publicKey exists in the database
        const keyData = await TestKey.findOne({ publicKey });

        if (!keyData) {
            return res.status(404).json({ error: "Public key not found in test.keys" });
        }

        res.json({
            success: true,
            keyId: keyData.keyId, // Return the corresponding keyId
        });
    } catch (error) {
        console.error("Error in /generate-wallet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/sign-message", async (req, res) => {
    try {
        const { keyId, message } = req.body;

        if (!keyId || !message) {
            return res.status(400).json({ error: "Missing keyId or message" });
        }

        // Fetch the user's private key from MongoDB using keyId
        const user = await TestKey.findOne({ keyId });

        if (!user) {
            return res.status(404).json({ error: "Key ID not found" });
        }

        // Sign the message using the private key
        const wallet = new ethers.Wallet(user.privateKey);
        const signedMessage = await wallet.signMessage(message);

        res.json({ success: true, signedMessage });
    } catch (error) {
        console.error("Signing error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// 🚀 **Login API Endpoint**
app.post("/login", async (req, res) => {
    try {
        const { publicKey, signedMessage } = req.body;
        const message = "Login to our app";

        // Check if the public key exists in the database
        const user = await TestKey.findOne({ publicKey });

        if (!user) {
            return res.status(404).json({ error: "Public key not registered. Please generate a wallet first." });
        }

        // Verify the signed message
        const recoveredAddress = ethers.verifyMessage(message, signedMessage);

        if (recoveredAddress.toLowerCase() !== publicKey.toLowerCase()) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Extract User IP Address & Device Info
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.connection.remoteAddress || "Unknown";
        if (ip.startsWith("::ffff:")) {
            ip = ip.replace("::ffff:", "");
        }
        if (ip.includes(",")) {
            ip = ip.split(",")[0].trim();
        }

        const deviceInfo = req.headers["user-agent"] || "Unknown";

        // Update user's last login IP & device info
        await User.updateOne({ publicKey }, { ip, deviceInfo, lastLogin: new Date() });

        res.json({ success: true, message: "Login successful!", ip, deviceInfo });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// 🚀 **Test Route to verify server is running**
app.get("/", (req, res) => {
    res.send("✅ Blockchain Login Backend is Running!");
});

// 🚀 **Start Server**
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
