const express = require("express");
const {
    addCategoryToStockController,
    getCategoryStockController
} = require("../controllers/CategoryStock.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST /api/v1/category-stock - Kateqoriya stoka əlavə et (Authentication tələb olunur)
router.post("/", authMiddleware, addCategoryToStockController);

// GET /api/v1/category-stock - Kateqoriya stoklarını gətir (Authentication tələb olunur)
router.get("/", authMiddleware, getCategoryStockController);

// Test route
router.get("/test", (req, res) => {
    console.log("CategoryStock test route called");
    res.json({ message: "CategoryStock routes working" });
});

module.exports = router;