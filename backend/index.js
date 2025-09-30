require("dotenv").config(); // Çevresel değişkenleri en başta yükle
const express = require("express");
const cors = require("cors");
const http = require('http');
const connectToDatabase = require("./config/database");
const allRoutes = require("./routes/routes");
const errorHandler = require("./middlewares/errorHandler");
const DatabaseHealthCheck = require("./utils/dbHealthCheck");

const PORT = process.env.PORT || 5009;
const app = express();
const server = http.createServer(app);

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
}); 


connectToDatabase();

// Setup database health monitoring
DatabaseHealthCheck.setupConnectionEventListeners();
DatabaseHealthCheck.monitorConnectionPool();

app.use("/api/v1/auth", allRoutes.authRoutes);
app.use("/api/v1/store", allRoutes.storeRoutes);
app.use("/api/v1/category-stock", allRoutes.categoryStockRoutes);
app.use("/api/v1/products-stock", allRoutes.productRoutes);
app.use("/api/v1/system", allRoutes.systemRoutes);
app.use("/api/v1/scrapers", allRoutes.scraperRoutes);

// Health check endpoint
app.get("/api/v1/health", async (req, res) => {
  try {
    const dbHealth = await DatabaseHealthCheck.checkConnectionHealth();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Debug route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

app.use(errorHandler);


// Start server
server.listen(PORT, "0.0.0.0",() => {
    console.log(`Server ${PORT} portunda işləyir`);
    console.log(`WebSocket service available at ws://localhost:${PORT}`);
});



