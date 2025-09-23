const axios = require('axios');

// MyMemory API yapılandırması (ücretsiz, API key gerektirmez)
const MYMEMORY_CONFIG = {
  baseURL: 'https://api.mymemory.translated.net/get',
  timeout: 15000,
  retries: 3
};

/**
 * Azeri kelimeleri Türkçe karşılıklarına çevirir
 */
const azeriToTurkishMap = {
  // Renkler
  'qirmizi': 'kırmızı',
  'qara': 'siyah', 
  'ag': 'beyaz',
  'ağ': 'beyaz',
  'göy': 'mavi',
  'yaşıl': 'yeşil',
  'sarı': 'sarı',
  
  // Giyim
  'idman': 'spor',
  'salvari': 'pantolon',
  'şalvarı': 'pantolon',
  'köynək': 'gömlek',
  'köynəyi': 'gömlek',
  'geyim': 'giyim',
  'geyimlər': 'giyimler',
  'geyimləri': 'giyimleri',
  
  // Bedenler
  'kiçik': 'küçük',
  'kicik': 'küçük',
  'orta': 'orta',
  'böyük': 'büyük',
  'boyuk': 'büyük',
  
  // Sıfatlar
  'yüksək': 'yüksek',
  'yuksek': 'yüksek',
  'keyfiyyətli': 'kaliteli',
  'keyfiyyetli': 'kaliteli',
  'rahat': 'rahat',
  'və': 've'
};

/**
 * Azeri metni Türkçeye çevirir
 */
function convertAzeriToTurkish(text) {
  if (!text) return text;
  
  let convertedText = text.toLowerCase();
  
  // Kelime kelime değiştir
  for (const [azeri, turkish] of Object.entries(azeriToTurkishMap)) {
    const regex = new RegExp('\\b' + azeri + '\\b', 'gi');
    convertedText = convertedText.replace(regex, turkish);
  }
  
  return convertedText;
}

/**
 * MyMemory API kullanarak metin çevirisi yapar
 * @param {string} text - Çevrilecek metin
 * @param {string} sourceLang - Kaynak dil kodu (az, tr, en vb.)
 * @param {string} targetLang - Hedef dil kodu (ru, en, tr vb.)
 * @returns {Promise<string>} - Çevrilmiş metin
 */
async function translateText(text, sourceLang = 'az', targetLang = 'ru') {
  if (!text || text.trim() === '') {
    return text;
  }

  try {
    let textToTranslate = text;
    
    // Azeri ise önce Türkçeye çevir
    if (sourceLang === 'az') {
      textToTranslate = convertAzeriToTurkish(text);
      console.log(`Azeri->Türkçe: "${text}" -> "${textToTranslate}"`);
    }
    
    const response = await axios.get(MYMEMORY_CONFIG.baseURL, {
      params: {
        q: textToTranslate,
        langpair: 'tr|ru'
      },
      timeout: MYMEMORY_CONFIG.timeout
    });

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const translatedText = response.data.responseData.translatedText;
      
      // Çeviri başarılı mı kontrol et
      if (translatedText && translatedText.toLowerCase() !== textToTranslate.toLowerCase()) {
        console.log(`Türkçe->Rusça: "${textToTranslate}" -> "${translatedText}"`);
        return translatedText;
      }
    }

    console.log(`MyMemory çeviri başarısız veya aynı metin döndü: ${text}`);
    return text; // Fallback: orijinal metni döndür

  } catch (error) {
    console.error('MyMemory çeviri hatası:', error.message);
    return text; // Fallback: orijinal metni döndür
  }
}

/**
 * Birden fazla metni toplu olarak çevirir (performans optimizasyonu)
 * @param {string[]} texts - Çevrilecek metinler dizisi
 * @param {string} sourceLang - Kaynak dil kodu
 * @param {string} targetLang - Hedef dil kodu
 * @returns {Promise<string[]>} - Çevrilmiş metinler dizisi
 */
async function translateMultipleTexts(texts, sourceLang = 'tr', targetLang = 'ru') {
  if (!Array.isArray(texts) || texts.length === 0) {
    return texts;
  }

  // Boş olmayan metinleri filtrele
  const validTexts = texts.filter(text => text && typeof text === 'string' && text.trim().length > 1);
  
  if (validTexts.length === 0) {
    return texts;
  }

  try {
    // Tüm metinleri tek bir istekte birleştir (performans için)
    const combinedText = validTexts.join(' |SEPARATOR| ');
    const translatedCombined = await translateText(combinedText, sourceLang, targetLang);
    
    if (translatedCombined && translatedCombined.includes('|SEPARATOR|')) {
      const translatedParts = translatedCombined.split(' |SEPARATOR| ');
      
      // Orijinal dizi ile aynı sırada sonuçları döndür
      let translatedIndex = 0;
      return texts.map(text => {
        if (text && typeof text === 'string' && text.trim().length > 1) {
          return translatedParts[translatedIndex++] || text;
        }
        return text;
      });
    }
    
    // Separator çalışmazsa tek tek çevir
    const translatedTexts = await Promise.all(
      texts.map(text => translateText(text, sourceLang, targetLang))
    );
    
    return translatedTexts;
    
  } catch (error) {
    console.error('Toplu çeviri hatası:', error.message);
    
    // Hata durumunda tek tek çevirmeyi dene
    try {
      const translatedTexts = await Promise.all(
        texts.map(text => translateText(text, sourceLang, targetLang))
      );
      return translatedTexts;
    } catch (individualError) {
      console.error('Tek tek çeviri de başarısız:', individualError.message);
      return texts; // Orijinal metinleri döndür
    }
  }
}

/**
 * Ürün nesnesinin string alanlarını Rusça'ya çevirir
 * @param {Object} product - Ürün nesnesi
 * @returns {Promise<Object>} - Çevrilmiş ürün nesnesi
 */
async function translateProductToRussian(product) {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const translatedProduct = { ...product };
  
  try {
    // Çevrilecek tüm metinleri topla
    const textsToTranslate = [];
    const textMappings = [];

    // Ana string alanları
    if (translatedProduct.name && typeof translatedProduct.name === 'string') {
      textsToTranslate.push(translatedProduct.name);
      textMappings.push({ field: 'name', index: textsToTranslate.length - 1 });
    }

    if (translatedProduct.description && typeof translatedProduct.description === 'string') {
      textsToTranslate.push(translatedProduct.description);
      textMappings.push({ field: 'description', index: textsToTranslate.length - 1 });
    }

    if (translatedProduct.categoryName && typeof translatedProduct.categoryName === 'string') {
      textsToTranslate.push(translatedProduct.categoryName);
      textMappings.push({ field: 'categoryName', index: textsToTranslate.length - 1 });
    }

    // Renkler dizisi
    if (translatedProduct.colors && Array.isArray(translatedProduct.colors)) {
      translatedProduct.colors.forEach((color, colorIndex) => {
        if (color && typeof color === 'string') {
          textsToTranslate.push(color);
          textMappings.push({ field: 'colors', index: textsToTranslate.length - 1, arrayIndex: colorIndex });
        }
      });
    }

    // Beden isimleri
    if (translatedProduct.sizes && Array.isArray(translatedProduct.sizes)) {
      translatedProduct.sizes.forEach((size, sizeIndex) => {
        if (size && size.sizeName && typeof size.sizeName === 'string') {
          textsToTranslate.push(size.sizeName);
          textMappings.push({ field: 'sizes', index: textsToTranslate.length - 1, arrayIndex: sizeIndex });
        }
      });
    }

    // Toplu çeviri yap
    if (textsToTranslate.length > 0) {
      const translatedTexts = await translateMultipleTexts(textsToTranslate);
      
      // Çevrilmiş metinleri geri yerleştir
      textMappings.forEach(mapping => {
        const translatedText = translatedTexts[mapping.index];
        
        if (mapping.field === 'colors') {
          translatedProduct.colors[mapping.arrayIndex] = translatedText;
        } else if (mapping.field === 'sizes') {
          translatedProduct.sizes[mapping.arrayIndex].sizeName = translatedText;
        } else {
          translatedProduct[mapping.field] = translatedText;
        }
      });
    }

    return translatedProduct;
    
  } catch (error) {
    console.error('Ürün çevirisi hatası:', error.message);
    return product; // Hata durumunda orijinal ürünü döndür
  }
}

/**
 * Türkçe metni Rusça'ya çevirir (geriye uyumluluk için)
 * @param {string} text - Çevrilecek metin
 * @returns {Promise<string>} - Çevrilmiş metin
 */
async function translateToRussian(text) {
  return await translateText(text, 'tr', 'ru');
}

module.exports = {
  translateText,
  translateMultipleTexts,
  translateToRussian,
  translateProductToRussian
};