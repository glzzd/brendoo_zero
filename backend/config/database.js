const mongoose = require("mongoose");

const connectToDatabase = async () => {
    try {
        const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/brendoo';
        console.log('Connecting to:', dbUrl);
        await mongoose.connect(dbUrl);
        console.log("Verilənlər bazasına qoşuldu");
    } catch (error) {
        console.error("Verilənlər bazasına qoşulma zamanı xəta baş verdi:", error.message);
        process.exit(1);
    }
};

module.exports = connectToDatabase;
