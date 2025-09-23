/**
 * Fiyat biçimlendirme yardımcı fonksiyonları
 * Price formatting utility functions
 */

/**
 * Gelen fiyat verisini doğru formata dönüştürür
 * Eğer ondalık nokta yoksa (örn: 29900), bunu 299.00 formatına çevirir
 * @param {string|number} priceInput - Gelen fiyat verisi
 * @returns {number} - Formatlanmış fiyat
 */
const formatPrice = (priceInput) => {
  // Null, undefined veya boş değerleri kontrol et
  if (!priceInput && priceInput !== 0) {
    return 0;
  }

  // String'e çevir
  let priceStr = priceInput.toString().trim();
  
  // Boş string kontrolü
  if (!priceStr) {
    return 0;
  }

  // Eğer zaten ondalık nokta varsa, parseFloat ile dönüştür
  if (priceStr.includes('.') || priceStr.includes(',')) {
    // Virgülü noktaya çevir (Türkçe format desteği)
    priceStr = priceStr.replace(',', '.');
    const parsed = parseFloat(priceStr);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  // Sadece rakam kontrolü
  if (!/^\d+$/.test(priceStr)) {
    // Geçersiz karakterler varsa parseFloat dene
    const parsed = parseFloat(priceStr);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  // Ondalık nokta yoksa ve sayı ise, son iki basamağı ondalık kısım olarak al
  const numericValue = parseInt(priceStr, 10);
  
  // Çok küçük sayılar için (0-99 arası) direkt kullan
  if (numericValue < 100) {
    return numericValue;
  }

  // 100 ve üzeri için son iki basamağı ondalık kısım yap
  // Örnek: 29900 -> 299.00, 12345 -> 123.45
  const integerPart = Math.floor(numericValue / 100);
  const decimalPart = numericValue % 100;
  
  return integerPart + (decimalPart / 100);
};

/**
 * Fiyat dizisini toplu olarak formatlar
 * @param {Array} prices - Fiyat dizisi
 * @returns {Array} - Formatlanmış fiyat dizisi
 */
const formatPrices = (prices) => {
  if (!Array.isArray(prices)) {
    return [];
  }
  
  return prices.map(price => formatPrice(price));
};

/**
 * Fiyat formatının geçerli olup olmadığını kontrol eder
 * @param {number} price - Kontrol edilecek fiyat
 * @returns {boolean} - Geçerli mi?
 */
const isValidPrice = (price) => {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
};

/**
 * Fiyatı para birimi ile birlikte formatlar
 * @param {number} price - Fiyat
 * @param {string} currency - Para birimi (varsayılan: AZN)
 * @returns {string} - Formatlanmış fiyat string'i
 */
const formatPriceWithCurrency = (price, currency = 'AZN') => {
  if (!isValidPrice(price)) {
    return `0.00 ${currency}`;
  }
  
  return `${price.toFixed(2)} ${currency}`;
};

module.exports = {
  formatPrice,
  formatPrices,
  isValidPrice,
  formatPriceWithCurrency
};