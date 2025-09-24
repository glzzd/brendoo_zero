const express = require("express");
const {
  createProduct,
  bulkCreateProducts,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByStore,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getProductStats,
  exportProductsAsXml,
  getAllProductsByStore
} = require("../controllers/Product.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// GET /api/v1/products/export-xml - Export products as XML by store name
router.get("/export-xml", exportProductsAsXml);

// GET /api/v1/products/integration/store - Get all products by store for integration (no pagination, no auth)
router.get("/integration/store", getAllProductsByStore);

// GET /api/v1/products/store/:storeName - Get products by store name (no auth required)
router.get("/store/:storeName", getProductsByStore);

// GET /api/v1/products/category/:categoryName - Get products by category
router.get("/category/:categoryName", getProductsByCategory);

// GET /api/v1/products/brand/:brandName - Get products by brand
router.get("/brand/:brandName", getProductsByBrand);

// GET /api/v1/products/search - Search products
router.get("/search", searchProducts);

// GET /api/v1/products/stats - Get product statistics
router.get("/stats", getProductStats);

// POST /api/v1/products - Create single product
router.post("/add-products", createProduct);

// POST /api/v1/products/bulk - Bulk create products
router.post("/bulk", bulkCreateProducts);

// GET /api/v1/products - Get products with pagination and filtering
router.get("/", getProducts);

// GET /api/v1/products/:id - Get product by ID
router.get("/:id", getProductById);

// PUT /api/v1/products/:id - Update product
router.put("/:id", updateProduct);

// DELETE /api/v1/products/:id - Delete product
router.delete("/:id", deleteProduct);

module.exports = router;