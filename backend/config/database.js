const mongoose = require("mongoose");

const connectToDatabase = async () => {
    try {
        const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/brendoo';
        console.log('Connecting to:', dbUrl);
        
        // Enhanced connection settings for better timeout handling
        const connectionOptions = {
            maxPoolSize: 15, // Increased maximum number of connections in the pool
            serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for server selection
            socketTimeoutMS: 120000, // Increased to 2 minutes for socket timeout
            connectTimeoutMS: 30000, // 30 seconds for initial connection
            heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            retryWrites: true, // Enable retryable writes
            retryReads: true, // Enable retryable reads
            bufferMaxEntries: 0, // Disable mongoose buffering
            bufferCommands: false, // Disable mongoose buffering
        };
        
        await mongoose.connect(dbUrl, connectionOptions);
        console.log("Verilənlər bazasına qoşuldu");
        
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });
        
    } catch (error) {
        console.error("Verilənlər bazasına qoşulma zamanı xəta baş verdi:", error.message);
        
        // Retry connection after 5 seconds
        console.log("5 saniyə sonra yenidən cəhd ediləcək...");
        setTimeout(() => {
            connectToDatabase();
        }, 5000);
    }
};

module.exports = connectToDatabase;
