const { addCategoryToStockService, getCategoryStockService } = require("../services/CategoryStock.service");

console.log("CategoryStock controller loaded successfully");

const addCategoryToStockController = async (req, res) => {
    try {
        const { categoryName, storeName, storeId } = req.body;
        
        // Validate required fields
        if (!categoryName || !storeName || !storeId) {
            return res.status(400).json({
                success: false,
                message: "Kateqoriya adı, mağaza adı və mağaza ID-si tələb olunur"
            });
        }

        // Check if category already exists for this store
        const CategoryStock = require("../models/CategoryStock.model");
        const existingCategory = await CategoryStock.findOne({
            categoryName: categoryName.trim(),
            storeName: storeName.trim()
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: `"${categoryName}" kateqoriyası artıq "${storeName}" mağazası üçün stokda mövcuddur`,
                isDuplicate: true
            });
        }

        // Add user from authenticated user
        const categoryStockData = {
            categoryName: categoryName.trim(),
            storeName: storeName.trim(),
            storeId,
            addedBy: req.user.id
        };

        const newCategoryStock = await addCategoryToStockService(categoryStockData);
        
        res.status(201).json({
            success: true,
            message: "Kateqoriya uğurla stoka əlavə edildi",
            data: newCategoryStock
        });
    } catch (error) {
        console.error("Category stock creation error:", error);
        
        // Handle unique constraint error (fallback)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Bu kateqoriya artıq bu mağaza üçün stokda mövcuddur",
                isDuplicate: true
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Kateqoriya stoka əlavə edilərkən xəta baş verdi",
            error: error.message
        });
    }
};

const getCategoryStockController = async (req, res) => {
    try {
        const { page = 1, limit = 10, storeName, categoryName } = req.query;
        
        const filters = {};
        if (storeName) filters.storeName = new RegExp(storeName, "i");
        if (categoryName) filters.categoryName = new RegExp(categoryName, "i");
        
        const result = await getCategoryStockService(filters, page, limit);
        
        res.status(200).json({
            success: true,
            message: "Kateqoriya stoku uğurla alındı",
            data: result.categoryStocks,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalItems,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage
            }
        });
    } catch (error) {
        console.error("Get category stock error:", error);
        res.status(500).json({
            success: false,
            message: "Kateqoriya stoku alınarkən xəta baş verdi",
            error: error.message
        });
    }
};

module.exports = {
    addCategoryToStockController,
    getCategoryStockController
};