const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
    getSystemStatsController,
    getCollectionStatsController
} = require("../controllers/System.controller");

// GET /api/v1/system/stats - Sistem istatistikleri (Authentication tələb olunur)
router.get("/stats", authMiddleware, getSystemStatsController);

// GET /api/v1/system/collections - Koleksiyon istatistikleri (Authentication tələb olunur)
router.get("/collections", authMiddleware, getCollectionStatsController);

module.exports = router;