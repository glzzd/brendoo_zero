const CategoryStock = require("../models/CategoryStock.model");


const addCategoryApiService = async (addedCategories) => {
  try {
    if (!Array.isArray(addedCategories) || addedCategories.length === 0) {
      throw new Error("Geçerli bir kategori listesi gönderilmedi");
    }

    const results = [];
    const errors = [];

    for (const item of addedCategories) {
      try {
        // Tüm string alanları lowercase'e çevir
        const categoryData = {
          categoryName: item.name?.toLowerCase().trim(),
          storeName: item.store?.toLowerCase().trim(),
          categoryType: item.type?.toLowerCase().trim(),
          img: item.img,
          status: "active",
        };

        // Var olan kategoriyi kontrol et (lowercase karşılaştırma)
        const existingCategory = await CategoryStock.findOne({
          categoryName: { $regex: new RegExp(`^${categoryData.categoryName}$`, 'i') },
          storeName: { $regex: new RegExp(`^${categoryData.storeName}$`, 'i') }
        });

        if (existingCategory) {
          // Var olan kategoriyi güncelle (stok durumu değişmiş olabilir)
          const updatedCategory = await CategoryStock.findByIdAndUpdate(
            existingCategory._id,
            {
              categoryType: categoryData.categoryType,
              img: categoryData.img,
              status: "active", // Tekrar geliyorsa aktif yap
              updatedAt: new Date()
            },
            { new: true }
          );
          results.push(updatedCategory);
        } else {
          // Yeni kategori ekle
          const newCategory = new CategoryStock(categoryData);
          const savedCategory = await newCategory.save();
          results.push(savedCategory);
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
      message: `${results.length} kategori işlendi (eklendi/güncellendi)`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: "Kategori işlenirken hata oluştu",
      error: error.message,
    };
  }
};


const addCategoryToStockService = async (categoryStockData) => {
    try {
        // Tüm string alanları lowercase'e çevir
        const formattedData = {
            ...categoryStockData,
            categoryName: categoryStockData.categoryName?.toLowerCase().trim(),
            storeName: categoryStockData.storeName?.toLowerCase().trim(),
            categoryType: categoryStockData.categoryType?.toLowerCase().trim()
        };

        // Var olan kategoriyi kontrol et (lowercase karşılaştırma)
        const existingCategory = await CategoryStock.findOne({
            categoryName: { $regex: new RegExp(`^${formattedData.categoryName}$`, 'i') },
            storeName: { $regex: new RegExp(`^${formattedData.storeName}$`, 'i') }
        });

        if (existingCategory) {
            // Var olan kategoriyi güncelle
            const updatedCategory = await CategoryStock.findByIdAndUpdate(
                existingCategory._id,
                {
                    categoryType: formattedData.categoryType,
                    img: formattedData.img,
                    status: formattedData.status || "active",
                    updatedAt: new Date()
                },
                { new: true }
            );

            // Populate related information
            await updatedCategory.populate([
                {
                    path: "storeId",
                    select: "name category logo"
                },
                {
                    path: "addedBy",
                    select: "name email"
                }
            ]);
            
            return updatedCategory;
        } else {
            // Yeni kategori ekle
            const newCategoryStock = new CategoryStock(formattedData);
            await newCategoryStock.save();
            
            // Populate related information
            await newCategoryStock.populate([
                {
                    path: "storeId",
                    select: "name category logo"
                },
                {
                    path: "addedBy",
                    select: "name email"
                }
            ]);
            
            return newCategoryStock;
        }
    } catch (error) {
        throw error; // Let controller handle specific error types
    }
};

const getCategoryStockService = async (filters = {}, page = 1, limit = 10) => {
    try {
        console.log("getCategoryStockService called with filters:", filters);
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Build query
        const query = CategoryStock.find(filters)
            .populate([
                {
                    path: "storeId",
                    select: "name category logo"
                },
                {
                    path: "addedBy",
                    select: "name email"
                }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Execute query and count
        const [categoryStocks, totalItems] = await Promise.all([
            query.exec(),
            CategoryStock.countDocuments(filters)
        ]);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = parseInt(page);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;
        
        return {
            categoryStocks,
            totalItems,
            totalPages,
            currentPage,
            hasNextPage,
            hasPrevPage
        };
    } catch (error) {
        throw new Error(`Kateqoriya stoku alınarkən xəta: ${error.message}`);
    }
};

const getCategoriesByStoreNameService = async (storeName) => {
    try {
        console.log("getCategoriesByStoreNameService called with storeName:", storeName);
        
        // Mağaza adını lowercase yaparak arama yap
        const categories = await CategoryStock.find({
            storeName: { $regex: new RegExp(`^${storeName.toLowerCase()}$`, 'i') },
            status: "active"
        })
        .select('categoryName categoryType img storeName status createdAt')
        .sort({ categoryName: 1 });
        
        return {
            success: true,
            categories,
            count: categories.length,
            storeName: storeName
        };
    } catch (error) {
        throw new Error(`Mağaza kategorileri alınarkən xəta: ${error.message}`);
    }
};

module.exports = {
addCategoryApiService,

    addCategoryToStockService,
    getCategoryStockService,
    getCategoriesByStoreNameService
};