const CategoryStock = require("../models/CategoryStock.model");

const addCategoryToStockService = async (categoryStockData) => {
    try {
        const newCategoryStock = new CategoryStock(categoryStockData);
        await newCategoryStock.save();
        
        // Populate related information
        await newCategoryStock.populate([
            {
                path: "storeId",
                select: "name category logo"
            },
            {
                path: "addedBy",
                select: "name email"
            }
        ]);
        
        return newCategoryStock;
    } catch (error) {
        throw error; // Let controller handle specific error types
    }
};

const getCategoryStockService = async (filters = {}, page = 1, limit = 10) => {
    try {
        console.log("getCategoryStockService called with filters:", filters);
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Build query
        const query = CategoryStock.find(filters)
            .populate([
                {
                    path: "storeId",
                    select: "name category logo"
                },
                {
                    path: "addedBy",
                    select: "name email"
                }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Execute query and count
        const [categoryStocks, totalItems] = await Promise.all([
            query.exec(),
            CategoryStock.countDocuments(filters)
        ]);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = parseInt(page);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;
        
        return {
            categoryStocks,
            totalItems,
            totalPages,
            currentPage,
            hasNextPage,
            hasPrevPage
        };
    } catch (error) {
        throw new Error(`Kateqoriya stoku alınarkən xəta: ${error.message}`);
    }
};

module.exports = {
    addCategoryToStockService,
    getCategoryStockService
};