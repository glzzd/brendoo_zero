
const { addStoreService, getAllStoresService, updateStoreStatusService, addEndpointToStoreService, getStoreByIdService, updateStoreService, deleteStoreService, bulkDeleteStoresService, deleteEndpointFromStoreService, updateEndpointInStoreService } = require("../services/Store.service");

console.log("Store controller loaded successfully");

const addStoreController = async (req, res) => {
    try {
        const storeData = req.body;
        
        // Validate required fields
        if (!storeData.name || !storeData.category) {
            return res.status(400).json({
                success: false,
                message: "Mağaza adı və kateqoriya tələb olunur"
            });
        }

        // Add owner from authenticated user
        storeData.owner = req.user.id;

        const newStore = await addStoreService(storeData);
        
        res.status(201).json({
            success: true,
            message: "Mağaza uğurla əlavə edildi",
            data: newStore
        });
    } catch (error) {
        console.error("Store creation error:", error);
        res.status(500).json({
            success: false,
            message: "Mağaza əlavə edilərkən xəta baş verdi",
            error: error.message
        });
    }
};

const getAllStoresController = async (req, res) => {
    try {
        console.log("getAllStoresController called");
        const { page = 1, limit = 5, category, status, sort, name, date } = req.query;
        
        const filters = {};
        if (status) filters.status = status;
        if (category) filters.category = category;
        if (name) filters.name = new RegExp(name, "i");
        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filters.createdAt = {
                $gte: searchDate,
                $lt: nextDay
            };
        }
        
        console.log("Filters:", filters);
        
        // Handle sorting
        let sortOptions = { createdAt: -1 }; // default sort
        if (sort) {
            const isDescending = sort.startsWith('-');
            const field = isDescending ? sort.substring(1) : sort;
            sortOptions = { [field]: isDescending ? -1 : 1 };
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: {
                path: "owner",
                select: "name email"
            },
            sort: sortOptions
        };
        
        console.log("Options:", options);
        
        const stores = await getAllStoresService(filters, options);
        
        console.log("Stores retrieved:", stores);
        
        res.status(200).json({
            success: true,
            message: "Mağazalar uğurla gətirildi",
            data: stores.docs || stores,
            pagination: {
                totalDocs: stores.totalDocs,
                limit: stores.limit,
                page: stores.page,
                totalPages: stores.totalPages,
                hasNextPage: stores.hasNextPage,
                hasPrevPage: stores.hasPrevPage
            }
        });
    } catch (error) {
        console.error("Get stores error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Mağazalar gətirilərkən xəta baş verdi",
            error: error.message
        });
    }
};

const updateStoreStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Keçərli status tələb olunur (active və ya inactive)"
            });
        }

        const updatedStore = await updateStoreStatusService(id, status);
        
        if (!updatedStore) {
            return res.status(404).json({
                success: false,
                message: "Mağaza tapılmadı"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Mağaza statusu uğurla yeniləndi",
            data: updatedStore
        });
    } catch (error) {
        console.error("Store status update error:", error);
        res.status(500).json({
            success: false,
            message: "Status yenilənərkən xəta baş verdi",
            error: error.message
        });
    }
};

const addEndpointController = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { endpoints } = req.body;
        
        // Validate that endpoints array exists and is not empty
        if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Ən azı bir endpoint tələb olunur"
            });
        }
        
        // Validate each endpoint
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            if (!endpoint.name || !endpoint.url) {
                return res.status(400).json({
                    success: false,
                    message: `Endpoint ${i + 1}: Ad və URL tələb olunur`
                });
            }
        }

        // Add all endpoints
        let updatedStore;
        for (const endpointData of endpoints) {
            updatedStore = await addEndpointToStoreService(storeId, endpointData, req.user.id);
        }
        
        res.status(200).json({
            success: true,
            message: "Endpoint(lər) uğurla əlavə edildi",
            data: updatedStore
        });
    } catch (error) {
        console.error("Endpoint creation error:", error);
        res.status(500).json({
            success: false,
            message: "Endpoint əlavə edilərkən xəta baş verdi",
            error: error.message
        });
    }
};

const getStoreByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await getStoreByIdService(id);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Mağaza tapılmadı"
            });
        }
        
        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error("Get store error:", error);
        res.status(500).json({
            success: false,
            message: "Mağaza məlumatları alınarkən xəta baş verdi",
            error: error.message
        });
    }
};

const updateStoreController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate required fields
        if (!updateData.name || !updateData.category) {
            return res.status(400).json({
                success: false,
                message: "Mağaza adı və kateqoriya tələb olunur"
            });
        }
        
        const updatedStore = await updateStoreService(id, updateData);
        
        if (!updatedStore) {
            return res.status(404).json({
                success: false,
                message: "Mağaza tapılmadı"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Mağaza uğurla yeniləndi",
            data: updatedStore
        });
    } catch (error) {
        console.error("Store update error:", error);
        res.status(500).json({
            success: false,
            message: "Mağaza yenilənərkən xəta baş verdi",
            error: error.message
        });
    }
};

const deleteEndpointController = async (req, res) => {
    try {
        const { storeId, endpointId } = req.params;
        
        const updatedStore = await deleteEndpointFromStoreService(storeId, endpointId);
        
        res.status(200).json({
            success: true,
            message: "Endpoint uğurla silindi",
            data: updatedStore
        });
    } catch (error) {
        console.error("Delete endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Endpoint silinərkən xəta baş verdi",
            error: error.message
        });
    }
};

const updateEndpointController = async (req, res) => {
    try {
        const { storeId, endpointId } = req.params;
        const { name, url, method, description } = req.body;
        
        // Validate required fields
        if (!name || !url || !method) {
            return res.status(400).json({
                success: false,
                message: "Ad, URL və metod tələb olunur"
            });
        }
        
        const updatedStore = await updateEndpointInStoreService(storeId, endpointId, {
            name,
            url,
            method,
            description
        });
        
        res.status(200).json({
            success: true,
            message: "Endpoint uğurla yeniləndi",
            data: updatedStore
        });
    } catch (error) {
        console.error("Update endpoint error:", error);
        res.status(500).json({
            success: false,
            message: "Endpoint yeniləməkdə xəta baş verdi",
            error: error.message
        });
    }
};

const deleteStoreController = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedStore = await deleteStoreService(id);
        
        res.status(200).json({
            success: true,
            message: "Mağaza uğurla silindi",
            data: deletedStore
        });
    } catch (error) {
        console.error("Delete store error:", error);
        res.status(500).json({
            success: false,
            message: "Mağaza silinərkən xəta baş verdi",
            error: error.message
        });
    }
};

const bulkDeleteStoresController = async (req, res) => {
    try {
        const { storeIds } = req.body;
        
        if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Mağaza ID-ləri massivi tələb olunur"
            });
        }
        
        const result = await bulkDeleteStoresService(storeIds);
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} mağaza uğurla silindi`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error("Bulk delete stores error:", error);
        res.status(500).json({
            success: false,
            message: "Mağazalar silinərkən xəta baş verdi",
            error: error.message
        });
    }
};

module.exports = {
    addStoreController,
    getAllStoresController,
    updateStoreStatusController,
    addEndpointController,
    getStoreByIdController,
    updateStoreController,
    deleteStoreController,
    bulkDeleteStoresController,
    deleteEndpointController,
    updateEndpointController
};
