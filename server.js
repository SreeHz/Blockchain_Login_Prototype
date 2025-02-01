require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const requestIp = require("request-ip");
const ethers = require("ethers");
const User = require("./models/User"); // Import User model

const app = express();
const PORT = process.env.PORT || 5000;

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

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signedMessage);
        if (recoveredAddress !== publicKey) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Extract User IP Address & Device Info
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.connection.remoteAddress || "Unknown";

        // Handle IPv6-mapped IPv4 (e.g., "::ffff:192.168.x.x" → "192.168.x.x")
        if (ip.startsWith("::ffff:")) {
            ip = ip.replace("::ffff:", "");
        }

        const deviceInfo = req.headers["user-agent"] || "Unknown";

        // Create a new User document and save it to MongoDB
        const newUser = new User({
            publicKey,
            ip,
            deviceInfo
        });

        // Save the user to MongoDB
        await newUser.save();

        res.json({ success: true, message: "Login successful!", ip, deviceInfo });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get("/", (req, res) => {
    res.send("✅ Blockchain Login Backend is Running!");
});


// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
