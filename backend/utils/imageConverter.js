const axios = require('axios');

/**
 * Download image from URL and convert to base64
 * @param {string} imageUrl - The image URL to download
 * @param {number} maxSizeKB - Maximum file size in KB (default: 1000KB)
 * @returns {Promise<string>} Base64 encoded image with data URI prefix
 */
const downloadImageToBase64 = async (imageUrl, maxSizeKB = 1000) => {
  try {
    // Replace {width} placeholder with actual width for Zara images
    const processedUrl = imageUrl.replace('{width}', '1920');
    
    console.log(`Downloading image: ${processedUrl}`);
    
    const response = await axios.get(processedUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Check file size
    const fileSizeKB = response.data.length / 1024;
    if (fileSizeKB > maxSizeKB) {
      console.warn(`Image too large: ${fileSizeKB.toFixed(2)}KB > ${maxSizeKB}KB`);
      return null;
    }

    // Get content type from response headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // Convert to base64
    const base64 = Buffer.from(response.data).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    
    console.log(`Image converted successfully: ${fileSizeKB.toFixed(2)}KB`);
    return dataUri;
    
  } catch (error) {
    console.error(`Failed to download image ${imageUrl}:`, error.message);
    return null;
  }
};

/**
 * Convert multiple image URLs to base64
 * @param {string[]} imageUrls - Array of image URLs
 * @param {number} maxSizeKB - Maximum file size in KB per image
 * @returns {Promise<string[]>} Array of base64 encoded images (null for failed downloads)
 */
const downloadMultipleImagesToBase64 = async (imageUrls, maxSizeKB = 1000) => {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  const promises = imageUrls.map(url => downloadImageToBase64(url, maxSizeKB));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    } else {
      console.error(`Failed to convert image ${index + 1}:`, result.reason?.message || 'Unknown error');
      return null;
    }
  }).filter(Boolean); // Remove null values
};

/**
 * Check if a string is a valid URL
 * @param {string} str - String to check
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Process image array - convert URLs to base64, keep existing base64 as is
 * @param {string[]} images - Array of image URLs or base64 strings
 * @param {number} maxSizeKB - Maximum file size in KB per image
 * @returns {Promise<string[]>} Array of base64 encoded images
 */
const processImageArray = async (images, maxSizeKB = 1000) => {
  if (!Array.isArray(images)) {
    return [];
  }

  const processedImages = [];
  
  for (const image of images) {
    if (typeof image !== 'string') {
      continue;
    }
    
    // If already base64, keep as is
    if (image.startsWith('data:image/')) {
      processedImages.push(image);
    } 
    // If it's a URL, convert to base64
    else if (isValidUrl(image)) {
      const base64Image = await downloadImageToBase64(image, maxSizeKB);
      if (base64Image) {
        processedImages.push(base64Image);
      }
    }
  }
  
  return processedImages;
};

module.exports = {
  downloadImageToBase64,
  downloadMultipleImagesToBase64,
  processImageArray,
  isValidUrl
};