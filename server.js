require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const cors = require("cors");
const User = require("./models/User"); // Import User model
const { generateKeys, signMessage, verifyMessage } = require("./wallet/keyManager"); // Custom wallet system

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup for production (Render) and development (localhost)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://blockchain-login-prototype.onrender.com', 'https://frontend-login-prototype.vercel.app']
        : 'http://localhost:5173',  
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
};


// Middleware
app.use(cors(corsOptions));  // Use CORS for handling cross-origin requests
app.use(bodyParser.json());  // Parse incoming JSON requests
app.use(requestIp.mw());  // Capture IP addresses from requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 🚀 **Endpoint to Generate & Store User Wallet**
app.post("/generate-wallet", async (req, res) => {
    try {
        const { publicKey, keyId } = generateKeys(); // Create new wallet keys

        // Save the public key and keyId in the database (we NEVER store private keys)
        const newUser = new User({
            publicKey,
            keyId,  // Store key identifier
            ip: "Not logged in yet", 
            deviceInfo: "Not logged in yet"
        });

        await newUser.save();

        res.json({ success: true, publicKey, keyId }); // KeyId helps backend fetch the private key (not exposed to users)
    } catch (error) {
        console.error("Error generating wallet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🚀 **Login API Endpoint using our Custom Wallet**
app.post("/login", async (req, res) => {
    try {
        const { publicKey, signedMessage } = req.body;
        const message = "Login to our app";

        // Fetch user data from database
        const user = await User.findOne({ publicKey });
        if (!user) {
            return res.status(404).json({ error: "Public key not registered" });
        }

        // Verify the signed message using our own system
        const isValid = verifyMessage(user.publicKey, message, signedMessage);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Extract User IP Address & Device Info
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.connection.remoteAddress || "Unknown";
        if (ip.startsWith("::ffff:")) {
            ip = ip.replace("::ffff:", "");
        }
        // If multiple IPs are forwarded, take the first one (real public IP)
        if (ip.includes(",")) {
            ip = ip.split(",")[1].trim();
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

// 🚀 **Sign Message using Server-Side Private Key**
app.post("/sign-message", async (req, res) => {
    try {
        const { keyId, message } = req.body;
        
        if (!keyId || !message) {
            return res.status(400).json({ error: "Missing keyId or message" });
        }

        // Sign the message using the private key stored on the server
        const signedMessage = signMessage(keyId, message);

        res.json({ success: true, signedMessage });
    } catch (error) {
        console.error("Signing error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Test Route to verify server is running
app.get("/", (req, res) => {
    res.send("✅ Blockchain Login Backend is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
