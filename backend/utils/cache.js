const NodeCache = require('node-cache');

// Create cache instance with 10 minutes TTL
const cache = new NodeCache({ 
    stdTTL: 600, // 10 minutes
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Better performance
});

// Cache keys
const CACHE_KEYS = {
    STORE_BY_NAME: (storeName) => `store:${storeName.toLowerCase()}`,
    PRODUCTS_BY_STORE: (storeName, page, limit, filters) => {
        const filterStr = JSON.stringify(filters || {});
        return `products:${storeName.toLowerCase()}:${page}:${limit}:${filterStr}`;
    }
};

// Cache helper functions
const cacheHelper = {
    get: (key) => {
        try {
            return cache.get(key);
        } catch (error) {
            console.error('Cache get error:', error);
            return undefined;
        }
    },

    set: (key, value, ttl = null) => {
        try {
            return cache.set(key, value, ttl);
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    },

    del: (key) => {
        try {
            return cache.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    },

    flush: () => {
        try {
            return cache.flushAll();
        } catch (error) {
            console.error('Cache flush error:', error);
            return false;
        }
    },

    // Clear cache for specific store
    clearStoreCache: (storeName) => {
        try {
            const keys = cache.keys();
            const storeKeys = keys.filter(key => 
                key.includes(`store:${storeName.toLowerCase()}`) || 
                key.includes(`products:${storeName.toLowerCase()}`)
            );
            return cache.del(storeKeys);
        } catch (error) {
            console.error('Cache clear store error:', error);
            return false;
        }
    }
};

module.exports = {
    cache,
    cacheHelper,
    CACHE_KEYS
};