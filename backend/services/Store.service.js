

const Store = require("../models/Store.model");

const addStoreService = async (storeDetails) => {
    try {
        const newStore = new Store(storeDetails);
        await newStore.save();
        
        // Populate owner information
        await newStore.populate({
            path: "owner",
            select: "name email"
        });
        
        return newStore;
    } catch (error) {
        throw new Error(`Mağaza yaradılarkən xəta: ${error.message}`);
    }
};

const getAllStoresService = async (filters = {}, options = {}) => {
    try {
        console.log("getAllStoresService called with filters:", filters);
        console.log("getAllStoresService called with options:", options);
        
        const {
            page = 1,
            limit = 10,
            populate = null,
            sort = { createdAt: -1 }
        } = options;
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        console.log("Pagination - page:", page, "limit:", limit, "skip:", skip);
        
        // Build query
        let query = Store.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Add population if specified
        if (populate) {
            query = query.populate(populate);
        }
        
        console.log("Executing query...");
        
        // Execute query and get total count
        const [stores, totalCount] = await Promise.all([
            query.exec(),
            Store.countDocuments(filters)
        ]);
        
        console.log("Query results - stores count:", stores.length, "total count:", totalCount);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        const result = {
            docs: stores,
            totalDocs: totalCount,
            limit: parseInt(limit),
            page: parseInt(page),
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        };
        
        console.log("Returning result:", result);
        return result;
    } catch (error) {
        console.error("Get all stores service error:", error);
        console.error("Error stack:", error.stack);
        throw new Error("Mağazalar gətirilərkən xəta baş verdi: " + error.message);
    }
};

const getStoreByIdService = async (storeId) => {
    try {
        const store = await Store.findById(storeId).populate({
            path: "owner",
            select: "name email"
        });
        
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }
        
        return store;
    } catch (error) {
        throw new Error(`Mağaza gətirilərkən xəta: ${error.message}`);
    }
};

const updateStoreService = async (storeId, updateData) => {
    try {
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: "owner",
            select: "name email"
        });
        
        if (!updatedStore) {
            throw new Error("Mağaza tapılmadı");
        }
        
        return updatedStore;
    } catch (error) {
        throw new Error(`Mağaza yenilənərkən xəta: ${error.message}`);
    }
};

const deleteStoreService = async (storeId) => {
    try {
        const deletedStore = await Store.findByIdAndDelete(storeId);
        
        if (!deletedStore) {
            throw new Error("Mağaza tapılmadı");
        }
        
        return deletedStore;
    } catch (error) {
        throw new Error(`Mağaza silinərkən xəta: ${error.message}`);
    }
};

const bulkDeleteStoresService = async (storeIds) => {
    try {
        const result = await Store.deleteMany({ _id: { $in: storeIds } });
        return result;
    } catch (error) {
        throw new Error(`Mağazalar silinərkən xəta: ${error.message}`);
    }
};

const updateStoreStatusService = async (storeId, status) => {
    try {
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            { status },
            { new: true, runValidators: true }
        ).populate({
            path: "owner",
            select: "name email"
        });
        
        return updatedStore;
    } catch (error) {
        throw new Error(`Mağaza statusu yenilənərkən xəta: ${error.message}`);
    }
};

const addEndpointToStoreService = async (storeId, endpointData, userId) => {
    try {
        const store = await Store.findById(storeId);
        
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }
        
        // Check if user is the owner of the store
        if (store.owner.toString() !== userId.toString()) {
            throw new Error("Bu mağazaya endpoint əlavə etmək üçün icazəniz yoxdur");
        }
        
        // Add the new endpoint
        store.endpoints.push(endpointData);
        await store.save();
        
        // Populate owner information
        await store.populate({
            path: "owner",
            select: "name email"
        });
        
        return store;
    } catch (error) {
        throw new Error(`Endpoint əlavə edilərkən xəta: ${error.message}`);
    }
};

const deleteEndpointFromStoreService = async (storeId, endpointId) => {
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }
        
        // Remove endpoint from array
        store.endpoints = store.endpoints.filter(endpoint => endpoint._id.toString() !== endpointId);
        
        await store.save();
        
        // Populate owner information
        await store.populate({
            path: "owner",
            select: "name email"
        });
        
        return store;
    } catch (error) {
        throw new Error(`Endpoint silinərkən xəta: ${error.message}`);
    }
};

const updateEndpointInStoreService = async (storeId, endpointId, updateData) => {
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            throw new Error("Mağaza tapılmadı");
        }
        
        // Find and update endpoint
        const endpointIndex = store.endpoints.findIndex(endpoint => endpoint._id.toString() === endpointId);
        if (endpointIndex === -1) {
            throw new Error("Endpoint tapılmadı");
        }
        
        // Update endpoint data
        store.endpoints[endpointIndex] = {
            ...store.endpoints[endpointIndex].toObject(),
            ...updateData
        };
        
        await store.save();
        
        // Populate owner information
        await store.populate({
            path: "owner",
            select: "name email"
        });
        
        return store;
    } catch (error) {
        throw new Error(`Endpoint yeniləməkdə xəta: ${error.message}`);
    }
};

module.exports = {
    addStoreService,
    getAllStoresService,
    getStoreByIdService,
    updateStoreService,
    deleteStoreService,
    bulkDeleteStoresService,
    updateStoreStatusService,
    addEndpointToStoreService,
    deleteEndpointFromStoreService,
    updateEndpointInStoreService
}