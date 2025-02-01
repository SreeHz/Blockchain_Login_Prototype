require("dotenv").config(); 
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const ethers = require('ethers');
const User = require('./models/User'); // Import User model

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for requests from localhost
app.use(cors({
  origin: 'https://blockchain-login-prototype.onrender.com', // Allow only localhost:5173
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization'
}));

// Middleware
app.use(bodyParser.json());
app.use(requestIp.mw()); // Capture IP addresses

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Login API Endpoint
app.post("/login", async (req, res) => {
    try {
        const { publicKey, signedMessage } = req.body;
        const message = "Login to our app";

        // Verify Signature
        const recoveredAddress = ethers.verifyMessage(message, signedMessage);
        if (recoveredAddress.toLowerCase() !== publicKey.toLowerCase()) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Get IP & Device Info
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.connection.remoteAddress || "Unknown";
        if (ip.includes(",")) ip = ip.split(",")[0].trim(); // Handle multiple IPs
        const deviceInfo = req.headers["user-agent"] || "Unknown";

        // Store in MongoDB
        const newUser = new User({ publicKey, ip, deviceInfo });
        await newUser.save();

        res.json({ success: true, message: "Login successful!", ip, deviceInfo });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
