const { calculatePriceInRubles, calculateBulkPriceInRubles, getPriceRange } = require('../utils/priceCalculator');

describe('Price Calculator Tests', () => {
  
  describe('calculatePriceInRubles', () => {
    test('should calculate correct ruble price for range 1-100 (factor 120)', () => {
      expect(calculatePriceInRubles(50)).toBe(6000); // 50 * 120
      expect(calculatePriceInRubles(1)).toBe(120);   // 1 * 120
      expect(calculatePriceInRubles(100)).toBe(12000); // 100 * 120
    });

    test('should calculate correct ruble price for range 101-150 (factor 100)', () => {
      expect(calculatePriceInRubles(101)).toBe(10100); // 101 * 100
      expect(calculatePriceInRubles(125)).toBe(12500); // 125 * 100
      expect(calculatePriceInRubles(150)).toBe(15000); // 150 * 100
    });

    test('should calculate correct ruble price for range 151-200 (factor 90)', () => {
      expect(calculatePriceInRubles(151)).toBe(13590); // 151 * 90
      expect(calculatePriceInRubles(175)).toBe(15750); // 175 * 90
      expect(calculatePriceInRubles(200)).toBe(18000); // 200 * 90
    });

    test('should calculate correct ruble price for range 201-350 (factor 85)', () => {
      expect(calculatePriceInRubles(201)).toBe(17085); // 201 * 85
      expect(calculatePriceInRubles(275)).toBe(23375); // 275 * 85
      expect(calculatePriceInRubles(350)).toBe(29750); // 350 * 85
    });

    test('should calculate correct ruble price for range 351-5000 (factor 80)', () => {
      expect(calculatePriceInRubles(351)).toBe(28080); // 351 * 80
      expect(calculatePriceInRubles(1000)).toBe(80000); // 1000 * 80
      expect(calculatePriceInRubles(5000)).toBe(400000); // 5000 * 80
    });

    test('should handle edge cases', () => {
      expect(calculatePriceInRubles(0)).toBe(0);
      expect(calculatePriceInRubles(-10)).toBe(0);
      expect(calculatePriceInRubles(null)).toBe(0);
      expect(calculatePriceInRubles(undefined)).toBe(0);
      expect(calculatePriceInRubles('invalid')).toBe(0);
    });

    test('should handle prices above 5000 (should use factor 80)', () => {
      expect(calculatePriceInRubles(6000)).toBe(480000); // 6000 * 80
      expect(calculatePriceInRubles(10000)).toBe(800000); // 10000 * 80
    });
  });

  describe('calculateBulkPriceInRubles', () => {
    test('should calculate bulk prices correctly', () => {
      const prices = [50, 125, 175, 275, 500];
      const expected = [6000, 12500, 15750, 23375, 40000];
      expect(calculateBulkPriceInRubles(prices)).toEqual(expected);
    });

    test('should handle empty array', () => {
      expect(calculateBulkPriceInRubles([])).toEqual([]);
    });

    test('should handle invalid input', () => {
      expect(calculateBulkPriceInRubles(null)).toEqual([]);
      expect(calculateBulkPriceInRubles(undefined)).toEqual([]);
      expect(calculateBulkPriceInRubles('invalid')).toEqual([]);
    });
  });

  describe('getPriceRange', () => {
    test('should return correct range information', () => {
      expect(getPriceRange(50)).toEqual({ min: 1, max: 100, factor: 120 });
      expect(getPriceRange(125)).toEqual({ min: 101, max: 150, factor: 100 });
      expect(getPriceRange(175)).toEqual({ min: 151, max: 200, factor: 90 });
      expect(getPriceRange(275)).toEqual({ min: 201, max: 350, factor: 85 });
      expect(getPriceRange(500)).toEqual({ min: 351, max: 5000, factor: 80 });
      expect(getPriceRange(6000)).toEqual({ min: 351, max: 5000, factor: 80 });
    });

    test('should handle edge cases for range detection', () => {
      expect(getPriceRange(0)).toEqual({ min: 1, max: 100, factor: 120 });
      expect(getPriceRange(-10)).toEqual({ min: 1, max: 100, factor: 120 });
    });
  });
});