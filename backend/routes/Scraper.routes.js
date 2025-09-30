const express = require("express");
const router = express.Router();
const {
    getScraperProductsController,
    getProductSpecificScrapersController,
    startProductScraperController,
    startSpecificProductScraperController,
    checkScraperResultsController
} = require("../controllers/Scraper.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Scraper məhsullarını əldə etmək
router.get("/:scraperId/products", authMiddleware, getScraperProductsController);

// Məhsul spesifik scraper-ları siyahısı
router.get("/product-specific/list", authMiddleware, getProductSpecificScrapersController);

// Məhsul scraper başlatmaq
router.post("/start-product-scraper", authMiddleware, startProductScraperController);

// Spesifik məhsul scraper başlatmaq
router.post("/:scraperId/products/:productIndex/scrape", authMiddleware, startSpecificProductScraperController);

// Scraper nəticələrini yoxlamaq
router.get("/results/:outputFile", authMiddleware, checkScraperResultsController);

module.exports = router;