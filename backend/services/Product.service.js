const Product = require("../models/Product.model");
const Store = require("../models/Store.model");
const { cacheHelper, CACHE_KEYS } = require("../utils/cache");
const { getStoreEndpointDataService } = require("./StoreEndpoint.service");
const { calculatePriceInRubles } = require("../utils/priceCalculator");

const addProductsToStockService = async (products) => {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Geçerli ürün listesi gönderilmedi");
    }

    const results = [];
    const errors = [];

    for (const item of products) {
      try {
        // Tüm string alanları lowercase'e çevir
        const productData = {
          name: item.name?.toLowerCase().trim(),
          brand: item.brand?.toLowerCase().trim(),
          price: item.price,
          priceInRubles: calculatePriceInRubles(item.price),
          description: item.description || "",
          discountedPrice: item.discountedPrice || null,
          imageUrl: item.imageUrl || [],
          colors: item.colors?.map(color => color?.toLowerCase().trim()) || [],
          sizes: item.sizes?.map(size => ({
            sizeName: size.sizeName?.toLowerCase().trim(),
            onStock: size.onStock
          })) || [],
          storeName: item.storeName?.toLowerCase().trim(),
          categoryName: item.categoryName?.toLowerCase().trim()
        };

        // Var olan ürünü kontrol et (lowercase karşılaştırma)
        const existingProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${productData.name}$`, 'i') },
          brand: { $regex: new RegExp(`^${productData.brand}$`, 'i') },
          storeName: { $regex: new RegExp(`^${productData.storeName}$`, 'i') }
        });

        if (existingProduct) {
          // Var olan ürünü güncelle (stok durumu değişmiş olabilir)
          const updatedProduct = await Product.findByIdAndUpdate(
            existingProduct._id,
            {
              price: productData.price,
              priceInRubles: productData.priceInRubles,
              description: productData.description,
              discountedPrice: productData.discountedPrice,
              imageUrl: productData.imageUrl,
              colors: productData.colors,
              sizes: productData.sizes,
              categoryName: productData.categoryName,
              updatedAt: new Date()
            },
            { new: true }
          );
          results.push(updatedProduct);
        } else {
          // Yeni ürün ekle
          const newProduct = new Product(productData);
          const savedProduct = await newProduct.save();
          results.push(savedProduct);
        }
      } catch (itemError) {
        errors.push({
          item: item.name,
          error: itemError.message
        });
      }
    }

    return {
      success: true,
      message: `${results.length} ürün işlendi (eklendi/güncellendi)`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error("Ürün ekleme hatası:", error.message);

    return {
      success: false,
      message: "Ürün işlenirken hata oluştu",
      error: error.message
    };
  }
};
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
                    storeName: endpointProduct.storeName
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
                        ...endpointProduct
                    });

                    const savedProduct = await newProduct.save();

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
    // Tüm string alanları lowercase'e çevir
    const formattedProductData = {
      ...productData,
      name: productData.name?.toLowerCase().trim(),
      brand: productData.brand?.toLowerCase().trim(),
      storeName: productData.storeName?.toLowerCase().trim(),
      categoryName: productData.categoryName?.toLowerCase().trim(),
      colors: productData.colors?.map(color => color?.toLowerCase().trim()) || [],
      sizes: productData.sizes?.map(size => ({
        sizeName: size.sizeName?.toLowerCase().trim(),
        onStock: size.onStock
      })) || []
    };

    // Store kontrolünü kaldırıyoruz çünkü artık storeId field'ı yok

    // Check if product already exists (lowercase karşılaştırma)
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${formattedProductData.name}$`, 'i') },
      brand: { $regex: new RegExp(`^${formattedProductData.brand}$`, 'i') },
      storeName: { $regex: new RegExp(`^${formattedProductData.storeName}$`, 'i') }
    });

    if (existingProduct) {
      // Compare fields and update if necessary
      const changes = compareProductFields(existingProduct, formattedProductData);
      
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
      ...formattedProductData
    });

    const savedProduct = await newProduct.save();

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
    
    if (filters.storeName) {
      query.storeName = { $regex: filters.storeName, $options: "i" };
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
    const product = await Product.findById(productId);
    
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
        storeName: product.storeName,
        _id: { $ne: productId }
      };

      const existingProduct = await Product.findOne(duplicateQuery);
      if (existingProduct) {
        throw new Error("Bu ad və marka ilə məhsul artıq mövcuddur");
      }
    }

    // Eğer price güncelleniyor ise priceInRubles'ı da hesapla
    if (updateData.price) {
      updateData.priceInRubles = calculatePriceInRubles(updateData.price);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

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
        // String alanları lowercase'e çevir
        const formattedProductData = {
          ...productData,
          name: productData.name?.toLowerCase().trim(),
          brand: productData.brand?.toLowerCase().trim(),
          categoryName: categoryName?.toLowerCase().trim(),
          colors: productData.colors?.map(color => color?.toLowerCase().trim()) || [],
          sizes: productData.sizes?.map(size => ({
            sizeName: size.sizeName?.toLowerCase().trim(),
            onStock: size.onStock
          })) || []
        };

        const result = await addProductToStockService({
          ...formattedProductData,
          storeId,
          categoryName: categoryName?.toLowerCase().trim()
        }, userId);

        if (result.success) {
          results.success++;
        } else if (result.isDuplicate) {
          results.duplicates++;
        }

        results.details.push({
          name: formattedProductData.name,
          brand: formattedProductData.brand,
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
        const query = { storeName: { $regex: new RegExp(`^${store.name}$`, 'i') } };
        
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
  addProductsToStockService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  bulkAddProductsService,
  getProductsByStoreNameService
};