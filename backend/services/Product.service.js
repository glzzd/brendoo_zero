const Product = require("../models/Product.model");
const Store = require("../models/Store.model");
const { cacheHelper, CACHE_KEYS } = require("../utils/cache");
const { getStoreEndpointDataService } = require("./StoreEndpoint.service");

// Helper function to compare product fields and detect changes
const compareProductFields = (existingProduct, newProductData) => {
    const changes = {};
    const fieldsToCompare = ['name', 'brand', 'price', 'discountedPrice', 'description', 'colors', 'sizes', 'categoryName', 'imageUrl'];
    
    fieldsToCompare.forEach(field => {
        if (newProductData[field] !== undefined) {
            // Handle arrays (colors, sizes, imageUrl)
            if (Array.isArray(existingProduct[field]) && Array.isArray(newProductData[field])) {
                const existingSet = new Set(existingProduct[field]);
                const newSet = new Set(newProductData[field]);
                
                // Check if arrays are different
                if (existingSet.size !== newSet.size || 
                    ![...existingSet].every(item => newSet.has(item))) {
                    changes[field] = {
                        old: existingProduct[field],
                        new: newProductData[field]
                    };
                }
            } 
            // Handle regular fields
            else if (existingProduct[field] !== newProductData[field]) {
                changes[field] = {
                    old: existingProduct[field],
                    new: newProductData[field]
                };
            }
        }
    });
    
    return changes;
};

// Add product to stock with cache integration and smart updates
const addProductToStockService = async (productData, userId, useCache = false, storeId = null, endpointIndex = 1) => {
  try {
    let productsFromEndpoint = [];
    
    // If useCache is true, try to get products from cache first
    if (useCache && storeId) {
        try {
            const endpointData = await getStoreEndpointDataService(storeId, endpointIndex);
            productsFromEndpoint = Array.isArray(endpointData) ? endpointData : 
                                 (endpointData.products || endpointData.data || []);
            console.log(`Found ${productsFromEndpoint.length} products from cached endpoint data`);
        } catch (error) {
            console.warn(`Could not fetch endpoint data: ${error.message}`);
        }
    }
    
    // If we have products from endpoint, process them
    if (productsFromEndpoint.length > 0) {
        const results = [];
        
        for (const endpointProduct of productsFromEndpoint) {
            try {
                // Check if product already exists (same name, brand, and store)
                const existingProduct = await Product.findOne({
                    name: endpointProduct.name,
                    brand: endpointProduct.brand,
                    storeId: storeId
                });

                if (existingProduct) {
                    // Compare fields and update if necessary
                    const changes = compareProductFields(existingProduct, endpointProduct);
                    
                    if (Object.keys(changes).length > 0) {
                        // Update existing product with changes
                        Object.keys(changes).forEach(field => {
                            existingProduct[field] = changes[field].new;
                        });
                        
                        existingProduct.updatedAt = new Date();
                        const updatedProduct = await existingProduct.save();
                        
                        results.push({
                            success: true,
                            action: 'updated',
                            message: `Məhsul yeniləndi: ${Object.keys(changes).join(', ')} dəyişdi`,
                            product: updatedProduct,
                            changes: changes
                        });
                    } else {
                        results.push({
                            success: true,
                            action: 'no_change',
                            message: "Məhsul artıq mövcuddur və dəyişiklik yoxdur",
                            product: existingProduct
                        });
                    }
                } else {
                    // Create new product
                    const newProduct = new Product({
                        ...endpointProduct,
                        storeId: storeId,
                        addedBy: userId
                    });

                    const savedProduct = await newProduct.save();
                    await savedProduct.populate("storeId", "name");
                    await savedProduct.populate("addedBy", "name email");

                    results.push({
                        success: true,
                        action: 'created',
                        message: "Məhsul uğurla stok-a əlavə edildi",
                        product: savedProduct
                    });
                }
            } catch (error) {
                results.push({
                    success: false,
                    action: 'error',
                    message: `Məhsul emal edilərkən xəta: ${error.message}`,
                    product: endpointProduct
                });
            }
        }
        
        return {
            success: true,
            bulk: true,
            message: `${results.length} məhsul emal edildi`,
            results: results,
            summary: {
                total: results.length,
                created: results.filter(r => r.action === 'created').length,
                updated: results.filter(r => r.action === 'updated').length,
                noChange: results.filter(r => r.action === 'no_change').length,
                errors: results.filter(r => r.action === 'error').length
            }
        };
    }
    
    // Original single product logic
    // Check if store exists
    const store = await Store.findById(productData.storeId);
    if (!store) {
      throw new Error("Mağaza tapılmadı");
    }

    // Check if product already exists (same name, brand, and store)
    const existingProduct = await Product.findOne({
      name: productData.name,
      brand: productData.brand,
      storeId: productData.storeId
    });

    if (existingProduct) {
      // Compare fields and update if necessary
      const changes = compareProductFields(existingProduct, productData);
      
      if (Object.keys(changes).length > 0) {
        // Update existing product with changes
        Object.keys(changes).forEach(field => {
          existingProduct[field] = changes[field].new;
        });
        
        existingProduct.updatedAt = new Date();
        const updatedProduct = await existingProduct.save();
        
        return {
          success: true,
          action: 'updated',
          message: `Məhsul yeniləndi: ${Object.keys(changes).join(', ')} dəyişdi`,
          product: updatedProduct,
          changes: changes
        };
      } else {
        return {
          success: false,
          isDuplicate: true,
          message: "Bu məhsul artıq stokda mövcuddur və dəyişiklik yoxdur",
          product: existingProduct
        };
      }
    }

    // Create new product
    const newProduct = new Product({
      ...productData,
      addedBy: userId
    });

    const savedProduct = await newProduct.save();
    await savedProduct.populate("storeId", "name");
    await savedProduct.populate("addedBy", "name email");

    return {
      success: true,
      isDuplicate: false,
      message: "Məhsul uğurla stok-a əlavə edildi",
      product: savedProduct
    };
  } catch (error) {
    throw error;
  }
};

// Get products with pagination and filtering
const getProductsService = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (filters.storeId) {
      query.storeId = filters.storeId;
    }
    
    if (filters.categoryName) {
      query.categoryName = { $regex: filters.categoryName, $options: "i" };
    }
    
    if (filters.brand) {
      query.brand = { $regex: filters.brand, $options: "i" };
    }
    
    if (filters.name) {
      query.name = { $regex: filters.name, $options: "i" };
    }

    // Get products with pagination
    const products = await Product.find(query)
      .populate("storeId", "name")
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalDocs = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalDocs,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get product by ID
const getProductByIdService = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate("storeId", "name")
      .populate("addedBy", "name email");
    
    if (!product) {
      throw new Error("Məhsul tapılmadı");
    }

    return product;
  } catch (error) {
    throw error;
  }
};

// Update product
const updateProductService = async (productId, updateData, userId) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error("Məhsul tapılmadı");
    }

    // Check if updating name/brand would create duplicate
    if (updateData.name || updateData.brand) {
      const duplicateQuery = {
        name: updateData.name || product.name,
        brand: updateData.brand || product.brand,
        storeId: product.storeId,
        _id: { $ne: productId }
      };

      const existingProduct = await Product.findOne(duplicateQuery);
      if (existingProduct) {
        throw new Error("Bu ad və marka ilə məhsul artıq mövcuddur");
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("storeId", "name")
      .populate("addedBy", "name email");

    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

// Delete product
const deleteProductService = async (productId) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error("Məhsul tapılmadı");
    }

    await Product.findByIdAndDelete(productId);
    
    return {
      success: true,
      message: "Məhsul uğurla silindi"
    };
  } catch (error) {
    throw error;
  }
};

// Bulk add products (for synchronization)
const bulkAddProductsService = async (productsData, storeId, categoryName, userId) => {
  try {
    const results = {
      success: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };

    for (const productData of productsData) {
      try {
        const result = await addProductToStockService({
          ...productData,
          storeId,
          categoryName
        }, userId);

        if (result.success) {
          results.success++;
        } else if (result.isDuplicate) {
          results.duplicates++;
        }

        results.details.push({
          name: productData.name,
          brand: productData.brand,
          status: result.success ? 'success' : (result.isDuplicate ? 'duplicate' : 'error'),
          message: result.message
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          name: productData.name || 'Unknown',
          brand: productData.brand || 'Unknown',
          status: 'error',
          message: error.message
        });
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
};

const getProductsByStoreNameService = async (storeName, page = 1, limit = 10, filters = {}) => {
    try {
        // Check cache first
        const cacheKey = CACHE_KEYS.PRODUCTS_BY_STORE(storeName, 'all', 'all', filters);
        const cachedResult = cacheHelper.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // Get store with cache
        const storeCacheKey = CACHE_KEYS.STORE_BY_NAME(storeName);
        let store = cacheHelper.get(storeCacheKey);
        
        if (!store) {
            store = await Store.findOne({ 
                name: { $regex: new RegExp(`^${storeName}$`, 'i') }
            }).select('_id name').lean();
            
            if (!store) {
                throw new Error("Mağaza tapılmadı");
            }
            
            // Cache store for 30 minutes
            cacheHelper.set(storeCacheKey, store, 1800);
        }
        
        // Build query filters
        const query = { storeId: store._id };
        
        if (filters.categoryName) {
            query.categoryName = { $regex: new RegExp(filters.categoryName, 'i') };
        }
        if (filters.brand) {
            query.brand = { $regex: new RegExp(filters.brand, 'i') };
        }
        if (filters.minPrice || filters.maxPrice) {
            query.price = {};
            if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
            if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
        }

        // Get all products without pagination
        const pipeline = [
            { $match: query },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    name: 1,
                    brand: 1,
                    price: 1,
                    description: 1,
                    discountedPrice: 1,
                    // Limit imageUrl to first 2 images and truncate base64 data
                    imageUrl: {
                        $map: {
                            input: { $slice: ["$imageUrl", 2] },
                            as: "img",
                            in: {
                                $cond: {
                                    if: { $gt: [{ $strLenCP: "$$img" }, 1000] },
                                    then: { $concat: [{ $substr: ["$$img", 0, 1000] }, "..."] },
                                    else: "$$img"
                                }
                            }
                        }
                    },
                    colors: 1,
                    sizes: 1,
                    storeId: 1,
                    categoryName: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ];

        const products = await Product.aggregate(pipeline);
        const totalProducts = products.length;

        const response = {
            products,
            store: {
                _id: store._id,
                name: store.name
            },
            totalProducts,
            message: `${totalProducts} ürün bulundu`
        };

        // Cache result for 5 minutes
        cacheHelper.set(cacheKey, response, 300);

        return response;
    } catch (error) {
        throw new Error(`Məhsullar alınarkən xəta: ${error.message}`);
    }
};

module.exports = {
  addProductToStockService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  bulkAddProductsService,
  getProductsByStoreNameService
};