const { formatPrice, formatPrices, isValidPrice, formatPriceWithCurrency } = require('../utils/priceFormatter');

describe('Price Formatter Tests', () => {
  
  describe('formatPrice', () => {
    test('should convert integer without decimal to proper decimal format', () => {
      expect(formatPrice('29900')).toBe(299.00);
      expect(formatPrice('12345')).toBe(123.45);
      expect(formatPrice('100')).toBe(1.00);
      expect(formatPrice('1050')).toBe(10.50);
      expect(formatPrice('500')).toBe(5.00);
    });

    test('should handle numbers with existing decimals', () => {
      expect(formatPrice('299.00')).toBe(299.00);
      expect(formatPrice('123.45')).toBe(123.45);
      expect(formatPrice('12.5')).toBe(12.5);
      expect(formatPrice('0.99')).toBe(0.99);
    });

    test('should handle Turkish decimal format (comma)', () => {
      expect(formatPrice('299,00')).toBe(299.00);
      expect(formatPrice('123,45')).toBe(123.45);
      expect(formatPrice('12,5')).toBe(12.5);
    });

    test('should handle numeric input', () => {
      expect(formatPrice(29900)).toBe(299.00);
      expect(formatPrice(12345)).toBe(123.45);
      expect(formatPrice(299.00)).toBe(299.00);
      expect(formatPrice(123.45)).toBe(123.45);
    });

    test('should handle small numbers (under 100)', () => {
      expect(formatPrice('99')).toBe(99);
      expect(formatPrice('50')).toBe(50);
      expect(formatPrice('1')).toBe(1);
      expect(formatPrice('0')).toBe(0);
    });

    test('should handle edge cases', () => {
      expect(formatPrice(null)).toBe(0);
      expect(formatPrice(undefined)).toBe(0);
      expect(formatPrice('')).toBe(0);
      expect(formatPrice('   ')).toBe(0);
      expect(formatPrice('invalid')).toBe(0);
    });

    test('should handle zero values', () => {
      expect(formatPrice(0)).toBe(0);
      expect(formatPrice('0')).toBe(0);
      expect(formatPrice('00')).toBe(0);
    });
  });

  describe('formatPrices', () => {
    test('should format array of prices', () => {
      const input = ['29900', '12345', '500', '99'];
      const expected = [299.00, 123.45, 5.00, 99];
      expect(formatPrices(input)).toEqual(expected);
    });

    test('should handle empty array', () => {
      expect(formatPrices([])).toEqual([]);
    });

    test('should handle invalid input', () => {
      expect(formatPrices(null)).toEqual([]);
      expect(formatPrices(undefined)).toEqual([]);
      expect(formatPrices('not-array')).toEqual([]);
    });
  });

  describe('isValidPrice', () => {
    test('should validate correct prices', () => {
      expect(isValidPrice(299.00)).toBe(true);
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(123.45)).toBe(true);
    });

    test('should reject invalid prices', () => {
      expect(isValidPrice(-10)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice('string')).toBe(false);
      expect(isValidPrice(null)).toBe(false);
      expect(isValidPrice(undefined)).toBe(false);
    });
  });

  describe('formatPriceWithCurrency', () => {
    test('should format price with default currency', () => {
      expect(formatPriceWithCurrency(299.00)).toBe('299.00 AZN');
      expect(formatPriceWithCurrency(123.45)).toBe('123.45 AZN');
    });

    test('should format price with custom currency', () => {
      expect(formatPriceWithCurrency(299.00, 'USD')).toBe('299.00 USD');
      expect(formatPriceWithCurrency(123.45, 'EUR')).toBe('123.45 EUR');
    });

    test('should handle invalid prices', () => {
      expect(formatPriceWithCurrency(-10)).toBe('0.00 AZN');
      expect(formatPriceWithCurrency(NaN)).toBe('0.00 AZN');
      expect(formatPriceWithCurrency(null)).toBe('0.00 AZN');
    });
  });

  describe('Real-world examples', () => {
    test('should handle common e-commerce price formats', () => {
      // Zara style prices
      expect(formatPrice('2990')).toBe(29.90);
      expect(formatPrice('4995')).toBe(49.95);
      expect(formatPrice('9999')).toBe(99.99);
      
      // H&M style prices
      expect(formatPrice('1999')).toBe(19.99);
      expect(formatPrice('3499')).toBe(34.99);
      
      // Already formatted prices
      expect(formatPrice('29.90')).toBe(29.90);
      expect(formatPrice('49.95')).toBe(49.95);
    });
  });
});