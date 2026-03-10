// deleteHousesWithoutOwner.js
require('dotenv').config();
const mongoose = require('mongoose');
const House = require('./models/House'); // adjust path if needed

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/housefinder";

async function deleteHousesWithoutOwner() {
    try {
        await mongoose.connect(mongoURI); // remove options
        console.log("MongoDB connected");

        const count = await House.countDocuments({ owner: { $exists: false } });
        console.log(`Found ${count} houses without an owner.`);

        if (count === 0) {
            console.log("No houses to delete.");
            return process.exit(0);
        }

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question(`Are you sure you want to delete ${count} houses without owners? (yes/no) `, async answer => {
            if (answer.toLowerCase() === 'yes') {
                const result = await House.deleteMany({ owner: { $exists: false } });
                console.log(`Deleted ${result.deletedCount} houses.`);
            } else {
                console.log("Operation cancelled.");
            }
            readline.close();
            process.exit(0);
        });

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

deleteHousesWithoutOwner();