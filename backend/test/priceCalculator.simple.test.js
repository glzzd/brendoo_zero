const { calculatePriceInRubles, calculateBulkPriceInRubles, getPriceRange } = require('../utils/priceCalculator');

console.log('🧪 Price Calculator Test Başlıyor...\n');

// Test helper function
function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Hata: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Beklenen: ${expected}, Alınan: ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Beklenen: ${JSON.stringify(expected)}, Alınan: ${JSON.stringify(actual)}`);
      }
    }
  };
}

// calculatePriceInRubles testleri
console.log('📊 calculatePriceInRubles Testleri:');

test('1-100 aralığı için doğru hesaplama (faktör 120)', () => {
  expect(calculatePriceInRubles(50)).toBe(6000);
  expect(calculatePriceInRubles(1)).toBe(120);
  expect(calculatePriceInRubles(100)).toBe(12000);
});

test('101-150 aralığı için doğru hesaplama (faktör 100)', () => {
  expect(calculatePriceInRubles(101)).toBe(10100);
  expect(calculatePriceInRubles(125)).toBe(12500);
  expect(calculatePriceInRubles(150)).toBe(15000);
});

test('151-200 aralığı için doğru hesaplama (faktör 90)', () => {
  expect(calculatePriceInRubles(151)).toBe(13590);
  expect(calculatePriceInRubles(175)).toBe(15750);
  expect(calculatePriceInRubles(200)).toBe(18000);
});

test('201-350 aralığı için doğru hesaplama (faktör 85)', () => {
  expect(calculatePriceInRubles(201)).toBe(17085);
  expect(calculatePriceInRubles(275)).toBe(23375);
  expect(calculatePriceInRubles(350)).toBe(29750);
});

test('351-5000 aralığı için doğru hesaplama (faktör 80)', () => {
  expect(calculatePriceInRubles(351)).toBe(28080);
  expect(calculatePriceInRubles(1000)).toBe(80000);
  expect(calculatePriceInRubles(5000)).toBe(400000);
});

test('Geçersiz değerler için 0 döndürme', () => {
  expect(calculatePriceInRubles(0)).toBe(0);
  expect(calculatePriceInRubles(-10)).toBe(0);
  expect(calculatePriceInRubles(null)).toBe(0);
  expect(calculatePriceInRubles(undefined)).toBe(0);
});

test('5000 üzeri fiyatlar için faktör 80 kullanma', () => {
  expect(calculatePriceInRubles(6000)).toBe(480000);
  expect(calculatePriceInRubles(10000)).toBe(800000);
});

// calculateBulkPriceInRubles testleri
console.log('\n📊 calculateBulkPriceInRubles Testleri:');

test('Toplu fiyat hesaplama', () => {
  const prices = [50, 125, 175, 275, 500];
  const expected = [6000, 12500, 15750, 23375, 40000];
  expect(calculateBulkPriceInRubles(prices)).toEqual(expected);
});

test('Boş array için boş array döndürme', () => {
  expect(calculateBulkPriceInRubles([])).toEqual([]);
});

// getPriceRange testleri
console.log('\n📊 getPriceRange Testleri:');

test('Doğru aralık bilgisi döndürme', () => {
  expect(getPriceRange(50)).toEqual({ min: 1, max: 100, factor: 120 });
  expect(getPriceRange(125)).toEqual({ min: 101, max: 150, factor: 100 });
  expect(getPriceRange(175)).toEqual({ min: 151, max: 200, factor: 90 });
  expect(getPriceRange(275)).toEqual({ min: 201, max: 350, factor: 85 });
  expect(getPriceRange(500)).toEqual({ min: 351, max: 5000, factor: 80 });
});

// Örnek hesaplamalar
console.log('\n💰 Örnek Hesaplamalar:');
console.log(`50 AZN = ${calculatePriceInRubles(50)} RUB`);
console.log(`125 AZN = ${calculatePriceInRubles(125)} RUB`);
console.log(`175 AZN = ${calculatePriceInRubles(175)} RUB`);
console.log(`275 AZN = ${calculatePriceInRubles(275)} RUB`);
console.log(`500 AZN = ${calculatePriceInRubles(500)} RUB`);

console.log('\n🎉 Tüm testler tamamlandı!');