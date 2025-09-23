const CategoryStock = require("../models/CategoryStock.model");

// Kategori alanlarını karşılaştır ve değişiklikleri tespit et
const compareCategoryFields = (existingCategory, newCategoryData) => {
  const changes = {};
  const fieldsToCompare = ['categoryType', 'img', 'status'];
  
  fieldsToCompare.forEach(field => {
    if (newCategoryData[field] !== undefined && existingCategory[field] !== newCategoryData[field]) {
      changes[field] = {
        old: existingCategory[field],
        new: newCategoryData[field]
      };
    }
  });
  
  return changes;
};

const addCategoryApiService = async (addedCategories) => {
  try {
    if (!Array.isArray(addedCategories) || addedCategories.length === 0) {
      throw new Error("Geçerli bir kategori listesi gönderilmedi");
    }

    const results = [];
    const errors = [];
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

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
          // Değişiklikleri kontrol et
          const changes = compareCategoryFields(existingCategory, categoryData);
          
          if (Object.keys(changes).length > 0) {
            // Değişiklik varsa güncelle
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
            results.push({
              category: updatedCategory,
              action: 'updated',
              changes: changes
            });
            updatedCount++;
          } else {
            // Değişiklik yoksa sadece status'u aktif yap (eğer değilse)
            if (existingCategory.status !== 'active') {
              const updatedCategory = await CategoryStock.findByIdAndUpdate(
                existingCategory._id,
                { status: 'active', updatedAt: new Date() },
                { new: true }
              );
              results.push({
                category: updatedCategory,
                action: 'reactivated'
              });
              updatedCount++;
            } else {
              results.push({
                category: existingCategory,
                action: 'skipped',
                reason: 'No changes detected'
              });
              skippedCount++;
            }
          }
        } else {
          // Yeni kategori ekle
          const newCategory = new CategoryStock(categoryData);
          const savedCategory = await newCategory.save();
          results.push({
            category: savedCategory,
            action: 'added'
          });
          addedCount++;
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
      message: `${results.length} kategori işlendi: ${addedCount} eklendi, ${updatedCount} güncellendi, ${skippedCount} atlandı`,
      data: results,
      summary: {
        total: results.length,
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount
      },
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
            // Değişiklikleri kontrol et
            const changes = compareCategoryFields(existingCategory, formattedData);
            
            if (Object.keys(changes).length > 0) {
                // Değişiklik varsa güncelle
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

                return {
                    success: true,
                    message: "Kategori başarıyla güncellendi",
                    data: updatedCategory,
                    action: 'updated',
                    changes: changes
                };
            } else {
                return {
                    success: true,
                    message: "Kategori zaten mevcut, değişiklik yok",
                    data: existingCategory,
                    action: 'skipped',
                    reason: 'No changes detected'
                };
            }
        } else {
            // Yeni kategori ekle
            const newCategory = new CategoryStock(formattedData);
            const savedCategory = await newCategory.save();

            return {
                success: true,
                message: "Kategori başarıyla eklendi",
                data: savedCategory,
                action: 'added'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: "Kategori işlenirken hata oluştu",
            error: error.message
        };
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