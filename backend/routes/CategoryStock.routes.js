const express = require("express");
const {
    addCategoryToStockController,
    getCategoryStockController,
    addCategoryApiController,
    addCategoryController,
    getCategoriesByStoreNameController
} = require("../controllers/CategoryStock.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST /api/v1/category-stock - Kateqoriya stoka əlavə et (Authentication tələb olunur)
router.post("/", authMiddleware, addCategoryToStockController);

// GET /api/v1/category-stock - Kateqoriya stoklarını gətir (Authentication tələb olunur)
router.get("/", authMiddleware, getCategoryStockController);

// GET /api/v1/category-stock/store/:storeName - Mağaza adına görə kategorileri gətir
router.get("/store/:storeName", getCategoriesByStoreNameController);

router.post("/add-category",  addCategoryController);

// Test route
router.get("/test", (req, res) => {
    console.log("CategoryStock test route called");
    res.json({ message: "CategoryStock routes working" });
});

module.exports = router;