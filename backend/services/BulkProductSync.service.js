const { addProductToStockService } = require("./Product.service");
const { getStoreEndpointDataService, clearStoreEndpointCacheService } = require("./StoreEndpoint.service");
const Store = require("../models/Store.model");

// Sync products from store endpoint to database
const syncProductsFromStoreEndpointService = async (storeId, endpointIndex = 1, userId, forceRefresh = false) => {
    try {
        // Clear cache if force refresh is requested
        if (forceRefresh) {
            clearStoreEndpointCacheService(storeId, endpointIndex);
        }

        // Get store information
        const store = await Store.findById(storeId).select('name endpoints');
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }

        if (!store.endpoints || !store.endpoints[endpointIndex]) {
            throw new Error(`Endpoint ${endpointIndex} tapılmadı`);
        }

        console.log(`Starting product sync for store: ${store.name}, endpoint: ${store.endpoints[endpointIndex].name}`);

        // Use the enhanced addProductToStockService with cache integration
        const result = await addProductToStockService(
            {}, // Empty product data since we're using cache
            userId,
            true, // Use cache
            storeId,
            endpointIndex
        );

        return {
            success: true,
            message: `${store.name} mağazası üçün məhsul sinxronizasiyası tamamlandı`,
            store: {
                id: store._id,
                name: store.name,
                endpoint: store.endpoints[endpointIndex].name
            },
            ...result
        };

    } catch (error) {
        console.error(`Product sync error for store ${storeId}:`, error);
        throw new Error(`Məhsul sinxronizasiyası xətası: ${error.message}`);
    }
};

// Sync products for all stores that have endpoints
const syncAllStoresProductsService = async (userId, endpointIndex = 1) => {
    try {
        // Get all stores with endpoints
        const stores = await Store.find({
            'endpoints.1': { $exists: true } // Check if endpoint at index 1 exists
        }).select('_id name endpoints');

        if (stores.length === 0) {
            return {
                success: true,
                message: "Sinxronizasiya üçün uyğun mağaza tapılmadı",
                results: []
            };
        }

        const results = [];
        
        for (const store of stores) {
            try {
                const result = await syncProductsFromStoreEndpointService(
                    store._id,
                    endpointIndex,
                    userId
                );
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    store: {
                        id: store._id,
                        name: store.name
                    },
                    error: error.message
                });
            }
        }

        // Calculate summary
        const summary = {
            totalStores: stores.length,
            successfulStores: results.filter(r => r.success).length,
            failedStores: results.filter(r => !r.success).length,
            totalProducts: results.reduce((sum, r) => sum + (r.summary?.total || 0), 0),
            createdProducts: results.reduce((sum, r) => sum + (r.summary?.created || 0), 0),
            updatedProducts: results.reduce((sum, r) => sum + (r.summary?.updated || 0), 0)
        };

        return {
            success: true,
            message: `${summary.successfulStores}/${summary.totalStores} mağaza sinxronizasiya edildi`,
            summary,
            results
        };

    } catch (error) {
        console.error('Bulk sync error:', error);
        throw new Error(`Toplu sinxronizasiya xətası: ${error.message}`);
    }
};

module.exports = {
    syncProductsFromStoreEndpointService,
    syncAllStoresProductsService
};