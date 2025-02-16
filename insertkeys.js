const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

// Import TestKey model
const TestKey = require("./models/Testkey");

// Read keys.json file
const keysData = JSON.parse(fs.readFileSync("keys.json", "utf8")).users;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB");

        for (const user of keysData) {
            try {
                const existingKey = await TestKey.findOne({ publicKey: user.publicKey });

                if (!existingKey) {
                    await TestKey.create({
                        keyId: user.keyId,
                        publicKey: user.publicKey,
                        privateKey: user.privateKey
                    });
                    console.log(`✅ Inserted: ${user.publicKey}`);
                } else {
                    console.log(`⚠️ Skipped (Already Exists): ${user.publicKey}`);
                }
            } catch (error) {
                console.error(`❌ Error inserting ${user.publicKey}:`, error);
            }
        }

        mongoose.connection.close();
        console.log("🔌 Disconnected from MongoDB");
    })
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
