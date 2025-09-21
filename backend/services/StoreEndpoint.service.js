const { cacheHelper, CACHE_KEYS } = require("../utils/cache");
const Store = require("../models/Store.model");

// Fetch data from store endpoint and cache it
const fetchStoreEndpointDataService = async (storeId, endpointIndex) => {
    try {
        // Check cache first
        const cacheKey = CACHE_KEYS.STORE_ENDPOINT_DATA(storeId, endpointIndex);
        const cachedData = cacheHelper.get(cacheKey);
        
        if (cachedData) {
            console.log(`Cache hit for store ${storeId} endpoint ${endpointIndex}`);
            return cachedData;
        }

        // Get store with endpoints
        const store = await Store.findById(storeId).select('name endpoints');
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }

        // Check if endpoint exists
        if (!store.endpoints || !store.endpoints[endpointIndex]) {
            throw new Error("Endpoint tapılmadı");
        }

        const endpoint = store.endpoints[endpointIndex];
        
        // Make HTTP request to the endpoint
        const response = await fetch(endpoint.url, {
            method: endpoint.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Brendoo-Bot/1.0'
            },
            timeout: 10000 // 10 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache the data for 10 minutes (600 seconds)
        cacheHelper.set(cacheKey, data, 600);
        
        console.log(`Data fetched and cached for store ${storeId} endpoint ${endpointIndex}`);
        
        return data;
    } catch (error) {
        console.error(`Error fetching store endpoint data: ${error.message}`);
        throw new Error(`Endpoint məlumatları alınarkən xəta: ${error.message}`);
    }
};

// Get cached endpoint data or fetch if not available
const getStoreEndpointDataService = async (storeId, endpointIndex) => {
    try {
        return await fetchStoreEndpointDataService(storeId, endpointIndex);
    } catch (error) {
        throw error;
    }
};

// Clear cache for specific store endpoint
const clearStoreEndpointCacheService = (storeId, endpointIndex = null) => {
    try {
        if (endpointIndex !== null) {
            // Clear specific endpoint cache
            const cacheKey = CACHE_KEYS.STORE_ENDPOINT_DATA(storeId, endpointIndex);
            return cacheHelper.del(cacheKey);
        } else {
            // Clear all endpoint caches for the store
            return cacheHelper.clearStoreEndpointCache(storeId);
        }
    } catch (error) {
        console.error('Error clearing store endpoint cache:', error);
        return false;
    }
};

module.exports = {
    fetchStoreEndpointDataService,
    getStoreEndpointDataService,
    clearStoreEndpointCacheService
};