const { addCategoryToStockService, getCategoryStockService, addCategoryApiService, getCategoriesByStoreNameService } = require("../services/CategoryStock.service");

console.log("CategoryStock controller loaded successfully");

const addCategoryController = async (req, res) => {
  try {
    const categories = req.body; 
    console.log(categories);
    
    const result = await addCategoryApiService(categories);

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("Controller error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

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

const getCategoriesByStoreNameController = async (req, res) => {
    try {
        const { storeName } = req.params;
        
        if (!storeName) {
            return res.status(400).json({
                success: false,
                message: "Mağaza adı tələb olunur"
            });
        }
        
        const result = await getCategoriesByStoreNameService(storeName);
        
        res.status(200).json({
            success: true,
            message: `${result.count} kategori tapıldı`,
            data: result.categories,
            storeName: result.storeName,
            count: result.count
        });
    } catch (error) {
        console.error("Get categories by store name error:", error);
        res.status(500).json({
            success: false,
            message: "Mağaza kategorileri alınarkən xəta baş verdi",
            error: error.message
        });
    }
};

module.exports = {
addCategoryController,

    addCategoryToStockController,
    getCategoryStockController,
    getCategoriesByStoreNameController
};