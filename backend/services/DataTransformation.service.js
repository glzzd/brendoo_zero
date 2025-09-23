const mongoose = require('mongoose');
const { formatPrice } = require('../utils/priceFormatter');

class DataTransformationService {
  /**
   * Transform Zara product data to system format
   * @param {Object} zaraProduct - Zara product data
   * @returns {Object} - Transformed product data for system
   */
  static transformZaraProduct(zaraProduct) {
    try {
      // Extract sizes from Zara format
      const transformedSizes = this.transformSizes(zaraProduct.sizes || []);
      
      // Extract colors from Zara format
      const transformedColors = this.transformColors(zaraProduct.colors || []);
      
      // Clean and process images
      const cleanedImages = this.cleanImageUrls(zaraProduct.images || []);
      
      // Transform to system format
      const transformedProduct = {
        name: zaraProduct.name?.trim() || '',
        brand: zaraProduct.brand?.toLowerCase()?.trim() || 'zara',
        price: formatPrice(zaraProduct.price),
        priceInRubles: formatPrice(zaraProduct.price) || 0, // Assuming Zara price is in rubles
        description: zaraProduct.description?.trim() || '',
        discountedPrice: zaraProduct.discountedPrice ? formatPrice(zaraProduct.discountedPrice) : null,
        imageUrl: cleanedImages,
        colors: transformedColors,
        sizes: transformedSizes,
        storeName: zaraProduct.store?.toLowerCase()?.trim() || 'zara',
        categoryName: this.transformCategory(zaraProduct.category)
      };

      return transformedProduct;
    } catch (error) {
      console.error('Error transforming Zara product:', error);
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  /**
   * Transform multiple Zara products
   * @param {Array} zaraProducts - Array of Zara products
   * @returns {Array} - Array of transformed products
   */
  static transformZaraProducts(zaraProducts) {
    if (!Array.isArray(zaraProducts)) {
      throw new Error('Input must be an array of products');
    }

    return zaraProducts.map((product, index) => {
      try {
        return this.transformZaraProduct(product);
      } catch (error) {
        console.error(`Error transforming product at index ${index}:`, error);
        return null; // Skip invalid products
      }
    }).filter(product => product !== null); // Remove null entries
  }

  /**
   * Transform Zara sizes to system format
   * @param {Array} zaraSizes - Zara sizes array
   * @returns {Array} - Transformed sizes
   */
  static transformSizes(zaraSizes) {
    if (!Array.isArray(zaraSizes)) return [];

    return zaraSizes.map(size => {
      if (typeof size === 'string') {
        return {
          sizeName: size.trim(),
          onStock: true // Default to true for Zara products
        };
      } else if (typeof size === 'object' && size !== null) {
        return {
          sizeName: size.name || size.sizeName || size.size || 'Unknown',
          onStock: size.available !== false && size.onStock !== false // Default to true unless explicitly false
        };
      }
      return null;
    }).filter(size => size !== null);
  }

  /**
   * Transform Zara colors to system format
   * @param {Array} zaraColors - Zara colors array
   * @returns {Array} - Transformed colors
   */
  static transformColors(zaraColors) {
    if (!Array.isArray(zaraColors)) return [];

    return zaraColors.map(color => {
      if (typeof color === 'string') {
        return color.trim();
      } else if (typeof color === 'object' && color !== null) {
        return color.name || color.colorName || color.color || 'Unknown';
      }
      return null;
    }).filter(color => color !== null && color !== 'Unknown');
  }

  /**
   * Clean and process image URLs
   * @param {Array} images - Array of image URLs
   * @returns {Array} - Cleaned image URLs
   */
  static cleanImageUrls(images) {
    if (!Array.isArray(images)) return [];

    return images.map(img => {
      if (typeof img !== 'string') return null;
      
      // Remove backticks and extra spaces
      let cleanUrl = img.trim().replace(/^[`\s]+|[`\s]+$/g, '');
      
      // Replace {width} placeholder with actual width
      cleanUrl = cleanUrl.replace(/\{width\}/g, '800');
      
      // Validate URL format
      if (cleanUrl.startsWith('http') && cleanUrl.includes('zara.net')) {
        return cleanUrl;
      }
      
      return null;
    }).filter(url => url !== null);
  }

  /**
   * Convert price to AZN (assuming input is in rubles)
   * @param {Number} rublePrice - Price in rubles
   * @returns {Number} - Price in AZN
   */
  static convertPrice(rublePrice) {
    if (!rublePrice || typeof rublePrice !== 'number') return 0;
    
    // Conversion rate: 1 RUB ≈ 0.017 AZN (approximate, should be updated regularly)
    const conversionRate = 0.017;
    return Math.round(rublePrice * conversionRate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Transform category name to system format
   * @param {String} zaraCategory - Zara category
   * @returns {String} - Transformed category
   */
  static transformCategory(zaraCategory) {
    if (!zaraCategory || typeof zaraCategory !== 'string') return 'Digər';

    // Clean category name
    let category = zaraCategory.trim();
    
    // Remove language prefixes like "WOMAN-"
    category = category.replace(/^(WOMAN|MAN|KIDS?)-/i, '');
    
    // Convert common Russian categories to Azerbaijani
    const categoryMap = {
      'КУРТКИ': 'Geyim',
      'ПЛАТЬЯ': 'Geyim',
      'РУБАШКИ': 'Geyim',
      'БРЮКИ': 'Geyim',
      'ДЖИНСЫ': 'Geyim',
      'ОБУВЬ': 'Ayaqqabı',
      'СУМКИ': 'Çanta',
      'АКСЕССУАРЫ': 'Aksesuar'
    };

    return categoryMap[category.toUpperCase()] || category || 'Digər';
  }

  /**
   * Validate transformed product data
   * @param {Object} product - Transformed product
   * @returns {Boolean} - Is valid
   */
  static validateTransformedProduct(product) {
    const required = ['name', 'brand', 'price', 'storeName', 'categoryName'];
    
    for (const field of required) {
      if (!product[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      console.error('Invalid price');
      return false;
    }

    return true;
  }

  /**
   * Get transformation statistics
   * @param {Array} originalData - Original data array
   * @param {Array} transformedData - Transformed data array
   * @returns {Object} - Statistics
   */
  static getTransformationStats(originalData, transformedData) {
    return {
      originalCount: originalData.length,
      transformedCount: transformedData.length,
      successRate: ((transformedData.length / originalData.length) * 100).toFixed(2) + '%',
      failedCount: originalData.length - transformedData.length
    };
  }
}

module.exports = DataTransformationService;