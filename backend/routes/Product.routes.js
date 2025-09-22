const express = require("express");
const {
  addProductToStock,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  getProductsByStoreName,
  syncProductsFromStoreEndpoint,
  syncAllStoresProducts
} = require("../controllers/Product.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// GET /api/v1/products/store/:storeName - Get products by store name (no auth required)
router.get("/store/:storeName", getProductsByStoreName);

// All other routes require authentication


// POST /api/v1/products - Add single product to stock
router.post("/add-products", addProductToStock);

// POST /api/v1/products/bulk - Bulk add products (for synchronization)
router.post("/bulk", bulkAddProducts);

// POST /api/v1/products/sync/store/:storeId - Sync products from specific store endpoint
router.post("/sync/store/:storeId", syncProductsFromStoreEndpoint);

// POST /api/v1/products/sync/all - Sync products from all stores
router.post("/sync/all", syncAllStoresProducts);

// GET /api/v1/products - Get products with pagination and filtering
router.get("/", getProducts);

// GET /api/v1/products/:id - Get product xby ID
router.get("/:id", getProductById);

// PUT /api/v1/products/:id - Update product
router.put("/:id", updateProduct);

// DELETE /api/v1/products/:id - Delete product
router.delete("/:id", deleteProduct);

module.exports = router;