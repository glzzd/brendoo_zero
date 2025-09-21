const mongoose = require("mongoose");

const connectToDatabase = async () => {
    try {
        const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/brendoo';
        console.log('Connecting to:', dbUrl);
        
        // Optimize connection settings for better performance
        const connectionOptions = {
            maxPoolSize: 10, // Maximum number of connections in the pool
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };
        
        await mongoose.connect(dbUrl, connectionOptions);
        console.log("Verilənlər bazasına qoşuldu");
    } catch (error) {
        console.error("Verilənlər bazasına qoşulma zamanı xəta baş verdi:", error.message);
        process.exit(1);
    }
};

module.exports = connectToDatabase;
