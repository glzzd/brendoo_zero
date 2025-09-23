const {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  bulkCreateProductsService,
  getProductsByStoreService,
  getProductsByCategoryService,
  getProductsByBrandService,
  searchProductsService
} = require("../services/Product.service");

// Create a single product
const createProduct = async (req, res) => {
  try {
    const products = req.body
    
    console.log("📝 Creating new product:", products || 'Unknown');
    
    const result = await createProductService(products);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error("❌ Error in createProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while creating product",
      error: error.message
    });
  }
};

// Bulk create products
const bulkCreateProducts = async (req, res) => {
  try {
    console.log("📦 Bulk creating products");
    
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log("❌ Request body is empty");
      return res.status(400).json({
        success: false,
        message: "Request body is empty. Please send products data."
      });
    }
    
    // Extract products array from different possible formats
    let products = req.body.products || req.body;
    
    if (Array.isArray(req.body)) {
      products = req.body;
    }
    
    if (!products || !Array.isArray(products)) {
      console.log("❌ Products validation failed");
      return res.status(400).json({
        success: false,
        message: "Products array is required. Send either { products: [...] } or directly [...]"
      });
    }
    
    console.log(`📊 Processing ${products.length} products`);
    
    const result = await bulkCreateProductsService(products);
    
    res.status(201).json({
      success: true,
      message: "Products processed successfully",
      data: result
    });
  } catch (error) {
    console.error("❌ Error in bulkCreateProducts:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while processing products",
      error: error.message
    });
  }
};

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      store,
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      hasDiscount,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      store,
      category,
      brand,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      hasDiscount: hasDiscount === 'true',
      inStock: inStock === 'true',
      sortBy,
      sortOrder
    };
    
    const result = await getProductsService(filters);
    
    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.data,
      pagination: result.pagination,
      filters: result.appliedFilters
    });
  } catch (error) {
    console.error("❌ Error in getProducts:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving products",
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getProductByIdService(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Product retrieved successfully",
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("❌ Error in getProductById:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving product",
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Updating product ${id}`);
    
    const result = await updateProductService(id, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error("❌ Error in updateProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating product",
      error: error.message
    });
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting product ${id}`);
    
    const result = await deleteProductService(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting product",
      error: error.message
    });
  }
};

// Get products by store
const getProductsByStore = async (req, res) => {
  try {
    const { storeName } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const result = await getProductsByStoreService(storeName, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.status(200).json({
      success: true,
      message: `Products from ${storeName} retrieved successfully`,
      data: result.data,
      pagination: result.pagination,
      store: result.store
    });
  } catch (error) {
    console.error("❌ Error in getProductsByStore:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving store products",
      error: error.message
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { 
      store, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const result = await getProductsByCategoryService(categoryName, store, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.status(200).json({
      success: true,
      message: `Products in ${categoryName} category retrieved successfully`,
      data: result.data,
      pagination: result.pagination,
      category: result.category
    });
  } catch (error) {
    console.error("❌ Error in getProductsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving category products",
      error: error.message
    });
  }
};

// Get products by brand
const getProductsByBrand = async (req, res) => {
  try {
    const { brandName } = req.params;
    const { 
      store, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const result = await getProductsByBrandService(brandName, store, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.status(200).json({
      success: true,
      message: `Products from ${brandName} brand retrieved successfully`,
      data: result.data,
      pagination: result.pagination,
      brand: result.brand
    });
  } catch (error) {
    console.error("❌ Error in getProductsByBrand:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving brand products",
      error: error.message
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { 
      q: query, 
      store, 
      category, 
      brand,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }
    
    const result = await searchProductsService(query, {
      store,
      category,
      brand,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.status(200).json({
      success: true,
      message: `Search results for "${query}"`,
      data: result.data,
      pagination: result.pagination,
      searchQuery: query,
      totalResults: result.totalResults
    });
  } catch (error) {
    console.error("❌ Error in searchProducts:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while searching products",
      error: error.message
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const { store } = req.query;
    
    const Product = require("../models/Product.model");
    
    const matchStage = { isActive: true };
    if (store) {
      matchStage.store = store.toLowerCase();
    }
    
    const stats = await Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStores: { $addToSet: "$store" },
          totalCategories: { $addToSet: "$category" },
          totalBrands: { $addToSet: "$brand" },
          averagePrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          productsWithDiscount: {
            $sum: {
              $cond: [{ $ne: ["$discountedPrice", null] }, 1, 0]
            }
          },
          inStockProducts: {
            $sum: {
              $cond: [{ $eq: ["$stockStatus", "in_stock"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          totalStores: { $size: "$totalStores" },
          totalCategories: { $size: "$totalCategories" },
          totalBrands: { $size: "$totalBrands" },
          averagePrice: { $round: ["$averagePrice", 2] },
          minPrice: 1,
          maxPrice: 1,
          productsWithDiscount: 1,
          inStockProducts: 1,
          discountPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$productsWithDiscount", "$totalProducts"] }, 100] },
              2
            ]
          },
          inStockPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$inStockProducts", "$totalProducts"] }, 100] },
              2
            ]
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      message: "Product statistics retrieved successfully",
      data: stats[0] || {
        totalProducts: 0,
        totalStores: 0,
        totalCategories: 0,
        totalBrands: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        productsWithDiscount: 0,
        inStockProducts: 0,
        discountPercentage: 0,
        inStockPercentage: 0
      }
    });
  } catch (error) {
    console.error("❌ Error in getProductStats:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while retrieving statistics",
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  bulkCreateProducts,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByStore,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getProductStats
};