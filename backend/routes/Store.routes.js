const express = require("express");
const {
    addStoreController,
    getAllStoresController,
    updateStoreStatusController,
    addEndpointController,
    getStoreByIdController,
    updateStoreController,
    deleteStoreController,
    bulkDeleteStoresController,
    deleteEndpointController,
    updateEndpointController,
    getAllProductsOfCategoryController
} = require("../controllers/Store.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// POST /api/v1/store - Yeni mağaza əlavə et (Authentication tələb olunur)
router.post("/", authMiddleware, addStoreController);

// Test route
router.get("/test", (req, res) => {
    console.log("Store test route called");
    res.json({ message: "Store routes working" });
});

// GET /api/v1/store - Bütün mağazaları gətir (Public)
router.get("/", getAllStoresController);

// GET /api/v1/store/get-stores - Bütün mağazaları gətir (Authentication tələb olunur)
router.get("/get-stores", authMiddleware, getAllStoresController);

// Legacy route for backward compatibility
router.post("/add-store", authMiddleware, addStoreController);

// PUT /api/v1/store/:id/status - Mağaza statusunu yenilə (Authentication tələb olunur)
router.put("/:id/status", authMiddleware, updateStoreStatusController);

// POST /api/v1/store/:storeId/endpoint - Mağazaya endpoint əlavə et (Authentication tələb olunur)
router.post("/:storeId/endpoint", authMiddleware, addEndpointController);

// GET /api/v1/store/:id - Tək mağaza məlumatlarını gətir (Authentication tələb olunur)
router.get("/:id", authMiddleware, getStoreByIdController);

// PUT /api/v1/store/:id - Mağaza məlumatlarını yenilə (Authentication tələb olunur)
router.put("/:id", authMiddleware, updateStoreController);

// DELETE /api/v1/store/bulk-delete - Bulk mağaza sil (Authentication tələb olunur)
router.delete("/bulk-delete", authMiddleware, bulkDeleteStoresController);

// DELETE /api/v1/store/:id - Mağaza sil (Authentication tələb olunur)
router.delete("/:id", authMiddleware, deleteStoreController);

// DELETE /api/v1/store/:storeId/endpoint/:endpointId - Endpoint sil (Authentication tələb olunur)
router.delete("/:storeId/endpoint/:endpointId", authMiddleware, deleteEndpointController);

// PUT /api/v1/store/:storeId/endpoint/:endpointId - Endpoint yenilə (Authentication tələb olunur)
router.put("/:storeId/endpoint/:endpointId", authMiddleware, updateEndpointController);

// GET /api/v1/store/category/:categoryName - Kateqoriya üzrə məhsulları gətir (Public)
router.get("/category/:categoryName", getAllProductsOfCategoryController);

module.exports = router;
