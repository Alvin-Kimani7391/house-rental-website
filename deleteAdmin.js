require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const result = await User.deleteOne({
            email: process.env.ADMIN_EMAIL
        });

        if (result.deletedCount === 1) {
            console.log("Admin deleted successfully ✅");
        } else {
            console.log("Admin not found ⚠️");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error deleting admin:", error);
    }
}

deleteAdmin();