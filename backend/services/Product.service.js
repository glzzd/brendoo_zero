const Product = require("../models/Product.model");
const mongoose = require("mongoose");
const { calculatePriceInRubles } = require('../utils/priceCalculator');
const { formatPrice } = require('../utils/priceFormatter');

// Helper function to normalize size data
const normalizeSizes = (sizes) => {
  if (!sizes || !Array.isArray(sizes)) return [];
  
  return sizes.map(size => {
    if (typeof size === 'string') {
      return { sizeName: size, onStock: true };
    }
    if (typeof size === 'object' && size !== null) {
      return {
        sizeName: size.sizeName || size.name || size,
        onStock: size.onStock !== undefined ? size.onStock : true
      };
    }
    return { sizeName: String(size), onStock: true };
  });
};

// Helper function to normalize colors data
const normalizeColors = (colors) => {
  if (!colors || !Array.isArray(colors)) return [];
  
  return colors.map(color => {
    if (typeof color === 'string') return color;
    if (typeof color === 'object' && color !== null) {
      return color.name || color.colorName || Object.values(color)[0] || String(color);
    }
    return String(color);
  }).filter(Boolean);
};

// Helper function to normalize images data
const normalizeImages = (images) => {
  if (!images) return [];
  if (typeof images === 'string') return [images];
  if (Array.isArray(images)) return images.filter(Boolean);
  return [];
};

// Helper function to build query filters
const buildQueryFilters = (filters) => {
  const query = { isActive: true };
  
  if (filters.store) {
    query.store = filters.store.toLowerCase();
  }
  
  if (filters.category) {
    query.category = new RegExp(filters.category, 'i');
  }
  
  if (filters.brand) {
    query.brand = new RegExp(filters.brand, 'i');
  }
  
  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { brand: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { category: new RegExp(filters.search, 'i') }
    ];
  }
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }
  
  if (filters.hasDiscount) {
    query.discountedPrice = { $ne: null };
  }
  
  if (filters.inStock) {
    query.stockStatus = 'in_stock';
  }
  
  return query;
};

// Create single product or multiple products
const createProductService = async (productsData) => {
  try {
    // Check if productsData is an array
    if (Array.isArray(productsData)) {
      console.log(`🔧 Processing ${productsData.length} products as array`);
      
      const results = {
        success: true,
        added: 0,
        skipped: 0,
        errors: 0,
        details: []
      };
      
      // Map through each product and process
      for (const productData of productsData) {
        try {
          const singleResult = await processSingleProduct(productData);
          
          if (singleResult.success) {
            results.added++;
            results.details.push({
              name: singleResult.data.name,
              status: 'added',
              id: singleResult.data._id
            });
          } else {
            if (singleResult.error === "DUPLICATE_PRODUCT") {
              results.skipped++;
              results.details.push({
                name: productData.name || 'Unknown',
                status: 'skipped',
                reason: singleResult.message
              });
            } else {
              results.errors++;
              results.details.push({
                name: productData.name || 'Unknown',
                status: 'error',
                reason: singleResult.message
              });
            }
          }
        } catch (error) {
          results.errors++;
          results.details.push({
            name: productData.name || 'Unknown',
            status: 'error',
            reason: error.message
          });
        }
      }
      
      console.log(`✅ Array processing completed: ${results.added} added, ${results.skipped} skipped, ${results.errors} errors`);
      
      return {
        success: true,
        message: `Processed ${productsData.length} products: ${results.added} added, ${results.skipped} skipped, ${results.errors} errors`,
        data: results
      };
    } else {
      // Single product processing
      console.log("🔧 Processing single product data:", productsData);
      return await processSingleProduct(productsData);
    }
  } catch (error) {
    console.error("❌ Error in createProductService:", error);
    return {
      success: false,
      message: "Failed to create product(s)",
      error: error.message
    };
  }
};

// Helper function to process a single product
const processSingleProduct = async (productData) => {
  try {
    // Validate required fields
    if (!productData.name || !productData.brand || !productData.price) {
      return {
        success: false,
        message: "Name, brand, and price are required fields",
        error: "MISSING_REQUIRED_FIELDS"
      };
    }
    
    // Normalize data with proper lowercase handling
    const normalizedData = {
      name: productData.name.trim().toLowerCase(),
      brand: productData.brand.trim().toLowerCase(),
      price: formatPrice(productData.price),
      currency: productData.currency ? productData.currency.toUpperCase() : 'AZN',
      priceInRubles: calculatePriceInRubles(formatPrice(productData.price)),
      discountedPrice: productData.discountedPrice ? formatPrice(productData.discountedPrice) : null,
      description: productData.description || "",
      images: normalizeImages(productData.images || productData.imageUrl),
      sizes: normalizeSizes(productData.sizes),
      colors: normalizeColors(productData.colors),
      store: (productData.store || productData.storeName || "").toLowerCase(),
      category: (productData.category || productData.categoryName || "").toLowerCase(),
      processedAt: productData.processedAt || new Date().toLocaleTimeString()
    };
    
    // Check for existing product by name, store, category, and brand
    const existingProduct = await Product.findOne({
      name: normalizedData.name,
      brand: normalizedData.brand,
      store: normalizedData.store,
      category: normalizedData.category,
      isActive: true
    });
    
    if (existingProduct) {
      // Update existing product instead of creating duplicate
      const updateFields = {};
      let hasChanges = false;
      
      // Check and update price if different
      if (existingProduct.price !== normalizedData.price) {
        updateFields.price = normalizedData.price;
        updateFields.priceInRubles = normalizedData.priceInRubles;
        hasChanges = true;
      }
      
      // Check and update discounted price if different
      if (existingProduct.discountedPrice !== normalizedData.discountedPrice) {
        updateFields.discountedPrice = normalizedData.discountedPrice;
        hasChanges = true;
      }
      
      // Check and update currency if different
      if (existingProduct.currency !== normalizedData.currency) {
        updateFields.currency = normalizedData.currency;
        hasChanges = true;
      }
      
      // Check and update description if different
      if (existingProduct.description !== normalizedData.description && normalizedData.description) {
        updateFields.description = normalizedData.description;
        hasChanges = true;
      }
      
      // Check and update images if different
      if (JSON.stringify(existingProduct.images) !== JSON.stringify(normalizedData.images) && normalizedData.images.length > 0) {
        updateFields.images = normalizedData.images;
        hasChanges = true;
      }
      
      // Check and update sizes if different
      if (JSON.stringify(existingProduct.sizes) !== JSON.stringify(normalizedData.sizes)) {
        updateFields.sizes = normalizedData.sizes;
        hasChanges = true;
      }
      
      // Check and update colors if different
      if (JSON.stringify(existingProduct.colors) !== JSON.stringify(normalizedData.colors)) {
        updateFields.colors = normalizedData.colors;
        hasChanges = true;
      }
      
      if (hasChanges) {
        updateFields.processedAt = new Date().toLocaleTimeString('tr-TR', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        const updatedProduct = await Product.findByIdAndUpdate(
          existingProduct._id,
          updateFields,
          { new: true, runValidators: true }
        );
        
        console.log("✅ Product updated successfully:", updatedProduct._id);
        
        return {
          success: true,
          message: "Product updated successfully",
          data: updatedProduct,
          action: "updated"
        };
      } else {
        console.log("ℹ️ Product already exists with same data:", existingProduct._id);
        
        return {
          success: true,
          message: "Product already exists with same data",
          data: existingProduct,
          action: "skipped"
        };
      }
    }
    
    // Create new product
    const newProduct = new Product(normalizedData);
    const savedProduct = await newProduct.save();
    
    console.log("✅ Product created successfully:", savedProduct._id);
    
    return {
      success: true,
      message: "Product created successfully",
      data: savedProduct,
      action: "created"
    };
  } catch (error) {
    console.error("❌ Error in processSingleProduct:", error);
    return {
      success: false,
      message: "Failed to create product",
      error: error.message
    };
  }
};

// Bulk create products
const bulkCreateProductsService = async (products) => {
  try {
    console.log(`🔧 Processing ${products.length} products for bulk creation`);
    
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    for (const productData of products) {
      try {
        // Validate required fields
        if (!productData.name || !productData.brand || !productData.price) {
          results.skipped++;
          results.details.push({
            name: productData.name || 'Unknown',
            status: 'skipped',
            reason: 'Missing required fields (name, brand, price)'
          });
          continue;
        }
        
        // Normalize data
        const normalizedData = {
          name: productData.name.trim(),
          brand: productData.brand.trim().toUpperCase(),
          price: formatPrice(productData.price),
          discountedPrice: productData.discountedPrice ? formatPrice(productData.discountedPrice) : null,
          description: productData.description || "",
          images: normalizeImages(productData.images || productData.imageUrl),
          sizes: normalizeSizes(productData.sizes),
          colors: normalizeColors(productData.colors),
          store: (productData.store || productData.storeName || "").toLowerCase(),
          category: productData.category || productData.categoryName || "",
          processedAt: productData.processedAt || new Date().toLocaleTimeString()
        };
        
        // Check for existing product
        const existingProduct = await Product.findOne({
          name: normalizedData.name,
          brand: normalizedData.brand,
          store: normalizedData.store,
          isActive: true
        });
        
        if (existingProduct) {
          // Update existing product
          Object.assign(existingProduct, normalizedData);
          existingProduct.updatedAt = new Date();
          await existingProduct.save();
          
          results.updated++;
          results.details.push({
            name: normalizedData.name,
            status: 'updated',
            id: existingProduct._id
          });
        } else {
          // Create new product
          const newProduct = new Product(normalizedData);
          const savedProduct = await newProduct.save();
          
          results.added++;
          results.details.push({
            name: normalizedData.name,
            status: 'added',
            id: savedProduct._id
          });
        }
      } catch (error) {
        console.error(`❌ Error processing product ${productData.name}:`, error);
        results.errors++;
        results.details.push({
          name: productData.name || 'Unknown',
          status: 'error',
          reason: error.message
        });
      }
    }
    
    console.log(`✅ Bulk operation completed: ${results.added} added, ${results.updated} updated, ${results.skipped} skipped, ${results.errors} errors`);
    
    return results;
  } catch (error) {
    console.error("❌ Error in bulkCreateProductsService:", error);
    throw new Error(`Bulk creation failed: ${error.message}`);
  }
};

// Get products with filtering and pagination
const getProductsService = async (filters) => {
  try {
    const query = buildQueryFilters(filters);
    
    // Build sort object
    const sortObj = {};
    sortObj[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
    
    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;
    
    // Execute query
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / filters.limit);
    
    return {
      data: products,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: filters.limit,
        hasNextPage: filters.page < totalPages,
        hasPrevPage: filters.page > 1
      },
      appliedFilters: {
        store: filters.store,
        category: filters.category,
        brand: filters.brand,
        search: filters.search,
        priceRange: filters.minPrice || filters.maxPrice ? {
          min: filters.minPrice,
          max: filters.maxPrice
        } : null,
        hasDiscount: filters.hasDiscount,
        inStock: filters.inStock
      }
    };
  } catch (error) {
    console.error("❌ Error in getProductsService:", error);
    throw new Error(`Failed to retrieve products: ${error.message}`);
  }
};

// Get product by ID
const getProductByIdService = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return {
        success: false,
        message: "Invalid product ID format"
      };
    }
    
    const product = await Product.findOne({
      _id: productId,
      isActive: true
    }).lean();
    
    if (!product) {
      return {
        success: false,
        message: "Product not found"
      };
    }
    
    return {
      success: true,
      data: product
    };
  } catch (error) {
    console.error("❌ Error in getProductByIdService:", error);
    throw new Error(`Failed to retrieve product: ${error.message}`);
  }
};

// Update product
const updateProductService = async (productId, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return {
        success: false,
        message: "Invalid product ID format"
      };
    }
    
    const existingProduct = await Product.findOne({
      _id: productId,
      isActive: true
    });
    
    if (!existingProduct) {
      return {
        success: false,
        message: "Product not found"
      };
    }
    
    // Normalize update data
    const normalizedData = {};
    
    if (updateData.name) normalizedData.name = updateData.name.trim();
    if (updateData.brand) normalizedData.brand = updateData.brand.trim().toUpperCase();
    if (updateData.price !== undefined) normalizedData.price = formatPrice(updateData.price);
    if (updateData.discountedPrice !== undefined) 
      normalizedData.discountedPrice = updateData.discountedPrice ? formatPrice(updateData.discountedPrice) : null;
    if (updateData.description !== undefined) normalizedData.description = updateData.description;
    if (updateData.images || updateData.imageUrl) {
      normalizedData.images = normalizeImages(updateData.images || updateData.imageUrl);
    }
    if (updateData.sizes) normalizedData.sizes = normalizeSizes(updateData.sizes);
    if (updateData.colors) normalizedData.colors = normalizeColors(updateData.colors);
    if (updateData.store || updateData.storeName) {
      normalizedData.store = (updateData.store || updateData.storeName).toLowerCase();
    }
    if (updateData.category || updateData.categoryName) {
      normalizedData.category = updateData.category || updateData.categoryName;
    }
    if (updateData.processedAt) normalizedData.processedAt = updateData.processedAt;
    
    // Check for duplicate if name, brand, or store is being updated
    if (normalizedData.name || normalizedData.brand || normalizedData.store) {
      const checkData = {
        name: normalizedData.name || existingProduct.name,
        brand: normalizedData.brand || existingProduct.brand,
        store: normalizedData.store || existingProduct.store
      };
      
      const duplicate = await Product.findOne({
        ...checkData,
        _id: { $ne: productId },
        isActive: true
      });
      
      if (duplicate) {
        return {
          success: false,
          message: "Another product already exists with the same name, brand, and store",
          error: "DUPLICATE_PRODUCT"
        };
      }
    }
    
    // Update product
    Object.assign(existingProduct, normalizedData);
    existingProduct.updatedAt = new Date();
    
    const updatedProduct = await existingProduct.save();
    
    return {
      success: true,
      data: updatedProduct
    };
  } catch (error) {
    console.error("❌ Error in updateProductService:", error);
    return {
      success: false,
      message: "Failed to update product",
      error: error.message
    };
  }
};

// Delete product (soft delete)
const deleteProductService = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return {
        success: false,
        message: "Invalid product ID format"
      };
    }
    
    const product = await Product.findOne({
      _id: productId,
      isActive: true
    });
    
    if (!product) {
      return {
        success: false,
        message: "Product not found"
      };
    }
    
    // Soft delete
    product.isActive = false;
    product.updatedAt = new Date();
    await product.save();
    
    return {
      success: true,
      data: product
    };
  } catch (error) {
    console.error("❌ Error in deleteProductService:", error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }
};

// Get products by store
const getProductsByStoreService = async (storeName, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const query = {
      store: storeName.toLowerCase(),
      isActive: true
    };
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      store: storeName
    };
  } catch (error) {
    console.error("❌ Error in getProductsByStoreService:", error);
    throw new Error(`Failed to retrieve store products: ${error.message}`);
  }
};

// Get products by category
const getProductsByCategoryService = async (categoryName, storeName = null, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const query = {
      category: new RegExp(categoryName, 'i'),
      isActive: true
    };
    
    if (storeName) {
      query.store = storeName.toLowerCase();
    }
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      category: categoryName
    };
  } catch (error) {
    console.error("❌ Error in getProductsByCategoryService:", error);
    throw new Error(`Failed to retrieve category products: ${error.message}`);
  }
};

// Get products by brand
const getProductsByBrandService = async (brandName, storeName = null, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const query = {
      brand: new RegExp(brandName, 'i'),
      isActive: true
    };
    
    if (storeName) {
      query.store = storeName.toLowerCase();
    }
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      brand: brandName
    };
  } catch (error) {
    console.error("❌ Error in getProductsByBrandService:", error);
    throw new Error(`Failed to retrieve brand products: ${error.message}`);
  }
};

// Search products
const searchProductsService = async (searchQuery, options = {}) => {
  try {
    const {
      store,
      category,
      brand,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    const query = {
      $or: [
        { name: new RegExp(searchQuery, 'i') },
        { brand: new RegExp(searchQuery, 'i') },
        { description: new RegExp(searchQuery, 'i') },
        { category: new RegExp(searchQuery, 'i') }
      ],
      isActive: true
    };
    
    if (store) query.store = store.toLowerCase();
    if (category) query.category = new RegExp(category, 'i');
    if (brand) query.brand = new RegExp(brand, 'i');
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      totalResults: totalCount
    };
  } catch (error) {
    console.error("❌ Error in searchProductsService:", error);
    throw new Error(`Failed to search products: ${error.message}`);
  }
};

module.exports = {
  createProductService,
  bulkCreateProductsService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  getProductsByStoreService,
  getProductsByCategoryService,
  getProductsByBrandService,
  searchProductsService
};