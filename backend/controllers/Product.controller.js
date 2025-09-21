const {
  addProductToStockService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  bulkAddProductsService,
  getProductsByStoreNameService
} = require("../services/Product.service");

const { getStoreByNameService } = require("../services/Store.service");

// Add product to stock
const addProductToStock = async (req, res) => {
  try {
    const userId = req.user.id;
    const productData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'brand', 'price', 'storeId', 'categoryName'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Tələb olunan sahələr: ${missingFields.join(', ')}`,
        code: "MISSING_FIELDS"
      });
    }

    const result = await addProductToStockService(productData, userId);

    if (result.isDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: result.message,
        code: "DUPLICATE_PRODUCT",
        product: result.product
      });
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      product: result.product
    });
  } catch (error) {
    console.error("Error adding product to stock:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Məhsul əlavə edilərkən xəta baş verdi",
      code: "INTERNAL_ERROR"
    });
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

module.exports = {
  addProductToStock,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  getProductsByStoreName
};