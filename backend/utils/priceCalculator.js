/**
 * Fiyat aralıklarına göre rubl değeri hesaplama fonksiyonu
 * @param {number} price - AZN cinsinden fiyat
 * @returns {number} - Rubl cinsinden hesaplanmış fiyat
 */
const calculatePriceInRubles = (price) => {
  if (!price || typeof price !== 'number' || price < 0) {
    return 0;
  }

  let multiplier = 0;

  // Fiyat aralıklarına göre çarpan belirleme
  if (price >= 1 && price <= 100) {
    multiplier = 120;
  } else if (price >= 101 && price <= 150) {
    multiplier = 100;
  } else if (price >= 151 && price <= 200) {
    multiplier = 90;
  } else if (price >= 201 && price <= 350) {
    multiplier = 85;
  } else if (price >= 351 && price <= 5000) {
    multiplier = 80;
  } else {
    // 5000'den büyük değerler için varsayılan çarpan
    multiplier = 80;
  }

  // Hesaplanmış rubl değerini döndür (2 ondalık basamağa yuvarla)
  return Math.round(price * multiplier * 100) / 100;
};

/**
 * Toplu fiyat hesaplama fonksiyonu
 * @param {Array} products - Ürün listesi
 * @returns {Array} - Rubl fiyatları hesaplanmış ürün listesi
 */
const calculateBulkPricesInRubles = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map(product => ({
    ...product,
    priceInRubles: calculatePriceInRubles(product.price)
  }));
};

/**
 * Fiyat aralığı bilgisi döndürme fonksiyonu
 * @param {number} price - AZN cinsinden fiyat
 * @returns {object} - Fiyat aralığı ve çarpan bilgisi
 */
const getPriceRangeInfo = (price) => {
  if (!price || typeof price !== 'number' || price < 0) {
    return { range: 'Geçersiz', multiplier: 0, rublePrice: 0 };
  }

  let range = '';
  let multiplier = 0;

  if (price >= 1 && price <= 100) {
    range = '1-100 AZN';
    multiplier = 120;
  } else if (price >= 101 && price <= 150) {
    range = '101-150 AZN';
    multiplier = 100;
  } else if (price >= 151 && price <= 200) {
    range = '151-200 AZN';
    multiplier = 90;
  } else if (price >= 201 && price <= 350) {
    range = '201-350 AZN';
    multiplier = 85;
  } else if (price >= 351 && price <= 5000) {
    range = '351-5000 AZN';
    multiplier = 80;
  } else {
    range = '5000+ AZN';
    multiplier = 80;
  }

  return {
    range,
    multiplier,
    rublePrice: calculatePriceInRubles(price)
  };
};

/**
 * Toplu fiyat hesaplama fonksiyonu (sadece fiyat array'i için)
 * @param {Array} prices - Fiyat listesi
 * @returns {Array} - Rubl cinsinden hesaplanmış fiyat listesi
 */
const calculateBulkPriceInRubles = (prices) => {
  if (!Array.isArray(prices)) {
    return [];
  }

  return prices.map(price => calculatePriceInRubles(price));
};

/**
 * Fiyat aralığı bilgisi döndürme fonksiyonu (basit format)
 * @param {number} price - AZN cinsinden fiyat
 * @returns {object} - Min, max ve factor bilgisi
 */
const getPriceRange = (price) => {
  if (!price || typeof price !== 'number' || price < 0) {
    return { min: 1, max: 100, factor: 120 };
  }

  if (price >= 1 && price <= 100) {
    return { min: 1, max: 100, factor: 120 };
  } else if (price >= 101 && price <= 150) {
    return { min: 101, max: 150, factor: 100 };
  } else if (price >= 151 && price <= 200) {
    return { min: 151, max: 200, factor: 90 };
  } else if (price >= 201 && price <= 350) {
    return { min: 201, max: 350, factor: 85 };
  } else {
    return { min: 351, max: 5000, factor: 80 };
  }
};

module.exports = {
  calculatePriceInRubles,
  calculateBulkPricesInRubles,
  calculateBulkPriceInRubles,
  getPriceRangeInfo,
  getPriceRange
};