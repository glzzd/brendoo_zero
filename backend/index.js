require("dotenv").config(); // Çevresel değişkenleri en başta yükle
const express = require("express");
const cors = require("cors");
const http = require('http');
const connectToDatabase = require("./config/database");
const allRoutes = require("./routes/routes");
const errorHandler = require("./middlewares/errorHandler");

const PORT = process.env.PORT || 5001;
const app = express();
const server = http.createServer(app);

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
}); 


connectToDatabase();

app.use("/api/v1/auth", allRoutes.authRoutes);
app.use("/api/v1/store", allRoutes.storeRoutes);
app.use("/api/v1/category-stock", allRoutes.categoryStockRoutes);
app.use("/api/v1/products", allRoutes.productRoutes);

// Debug route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

app.use(errorHandler);


// Start server
server.listen(PORT, "0.0.0.0",() => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket service available at ws://localhost:${PORT}`);
});



