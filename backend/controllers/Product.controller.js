const {
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  bulkAddProductsService,
  getProductsByStoreNameService,
  addProductsToStockService
} = require("../services/Product.service");

const { syncProductsFromStoreEndpointService, syncAllStoresProductsService } = require("../services/BulkProductSync.service");

const { getStoreByNameService } = require("../services/Store.service");

// Add product to stock
const addProductToStock = async (req, res) => {
  try {
    const products = req.body; // array bekleniyor
    const result = await addProductsToStockService(products);

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("Controller error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get products with pagination and filtering
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      storeId: req.query.storeId,
      categoryName: req.query.categoryName,
      brand: req.query.brand,
      name: req.query.name
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const result = await getProductsService(page, limit, filters);

    return res.status(200).json({
      success: true,
      message: "Məhsullar uğurla gətirildi",
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Error getting products:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Məhsullar gətirilərkən xəta baş verdi",
      code: "INTERNAL_ERROR"
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Məhsul uğurla gətirildi",
      product
    });
  } catch (error) {
    console.error("Error getting product:", error);
    const statusCode = error.message === "Məhsul tapılmadı" ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Məhsul gətirilərkən xəta baş verdi",
      code: statusCode === 404 ? "PRODUCT_NOT_FOUND" : "INTERNAL_ERROR"
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedProduct = await updateProductService(id, updateData, userId);

    return res.status(200).json({
      success: true,
      message: "Məhsul uğurla yeniləndi",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    const statusCode = error.message === "Məhsul tapılmadı" ? 404 : 
                      error.message.includes("artıq mövcuddur") ? 409 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Məhsul yenilənərkən xəta baş verdi",
      code: statusCode === 404 ? "PRODUCT_NOT_FOUND" : 
            statusCode === 409 ? "DUPLICATE_PRODUCT" : "INTERNAL_ERROR"
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProductService(id);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    const statusCode = error.message === "Məhsul tapılmadı" ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Məhsul silinərkən xəta baş verdi",
      code: statusCode === 404 ? "PRODUCT_NOT_FOUND" : "INTERNAL_ERROR"
    });
  }
};

// Bulk add products (for synchronization)
const bulkAddProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { products, storeId, storeName, categoryName } = req.body;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Məhsul siyahısı tələb olunur",
        code: "MISSING_PRODUCTS"
      });
    }

    let finalStoreId = storeId;

    // If storeName is provided instead of storeId, find the store by name
    if (!storeId && storeName) {
      try {
        const store = await getStoreByNameService(storeName);
        finalStoreId = store._id;
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: `Mağaza tapılmadı: ${storeName}`,
          code: "STORE_NOT_FOUND"
        });
      }
    }

    if (!finalStoreId || !categoryName) {
      return res.status(400).json({
        success: false,
        message: "Mağaza ID/adı və kategori adı tələb olunur",
        code: "MISSING_FIELDS"
      });
    }

    const results = await bulkAddProductsService(products, finalStoreId, categoryName, userId);

    return res.status(200).json({
      success: true,
      message: `${results.success} məhsul əlavə edildi, ${results.duplicates} təkrar, ${results.errors} xəta`,
      results
    });
  } catch (error) {
    console.error("Error bulk adding products:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Məhsullar əlavə edilərkən xəta baş verdi",
      code: "INTERNAL_ERROR"
    });
  }
};

// Get products by store name
const getProductsByStoreName = async (req, res) => {
  try {
    const { storeName } = req.params;
    const filters = {
      categoryName: req.query.categoryName,
      brand: req.query.brand,
      name: req.query.name
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const result = await getProductsByStoreNameService(storeName, 1, 10, filters);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.products,
      totalProducts: result.totalProducts,
      store: result.store
    });
  } catch (error) {
    console.error("Error getting products by store name:", error);
    
    if (error.message.includes("Mağaza tapılmadı")) {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: "STORE_NOT_FOUND"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Mağaza məhsulları gətirilərkən xəta baş verdi",
      code: "INTERNAL_ERROR"
    });
  }
};

// Sync products from store endpoint
const syncProductsFromStoreEndpoint = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { endpointIndex = 1, forceRefresh = false } = req.body;
    const userId = req.user.id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID tələb olunur",
        code: "MISSING_STORE_ID"
      });
    }

    const result = await syncProductsFromStoreEndpointService(
      storeId, 
      parseInt(endpointIndex), 
      userId, 
      forceRefresh
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error("Error syncing products from store endpoint:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Məhsul sinxronizasiyası zamanı xəta baş verdi",
      code: "SYNC_ERROR"
    });
  }
};

// Sync products from all stores
const syncAllStoresProducts = async (req, res) => {
  try {
    const { endpointIndex = 1 } = req.body;
    const userId = req.user.id;

    const result = await syncAllStoresProductsService(userId, parseInt(endpointIndex));

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error("Error syncing all stores products:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Bütün mağazalar üçün sinxronizasiya zamanı xəta baş verdi",
      code: "BULK_SYNC_ERROR"
    });
  }
};

module.exports = {
  addProductToStock,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  getProductsByStoreName,
  syncProductsFromStoreEndpoint,
  syncAllStoresProducts
};