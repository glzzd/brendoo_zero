import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Store, Tag, Calendar, Package, ExternalLink, Heart, Share2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset image index when product changes
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Get product images (fallback to placeholder if no images)
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/api/placeholder/400/400'];

  // Navigate to next image
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // Navigate to previous image
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Format price
  const formatPrice = (price, currency = 'AZN') => {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return 'N/A';
    }
    
    const numericPrice = Number(price);
    const currencyMap = {
      'AZN': { locale: 'az-AZ', currency: 'AZN' },
      'USD': { locale: 'en-US', currency: 'USD' },
      'EUR': { locale: 'de-DE', currency: 'EUR' },
      'RUB': { locale: 'ru-RU', currency: 'RUB' },
      'TRY': { locale: 'tr-TR', currency: 'TRY' }
    };
    
    const config = currencyMap[currency] || currencyMap['AZN'];
    
    try {
      // Əgər fiyatın sonunda sıfır yoxdursa, .00 əlavə et
      let formattedPrice = numericPrice.toString();
      if (!formattedPrice.includes('.')) {
        formattedPrice += '.00';
      } else {
        // Əgər ondalık hissə 1 rəqəmdirsə, sıfır əlavə et
        const decimalPart = formattedPrice.split('.')[1];
        if (decimalPart.length === 1) {
          formattedPrice += '0';
        }
      }
      
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency
      }).format(parseFloat(formattedPrice));
    } catch (error) {
      // Əgər fiyatın sonunda sıfır yoxdursa, .00 əlavə et
      let fallbackPrice = numericPrice.toString();
      if (!fallbackPrice.includes('.')) {
        fallbackPrice += '.00';
      } else {
        const decimalPart = fallbackPrice.split('.')[1];
        if (decimalPart.length === 1) {
          fallbackPrice += '0';
        }
      }
      return `${fallbackPrice} ${currency}`;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Image Modal Component
  const ImageModal = () => {
    if (!isImageModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.src = '/api/placeholder/800/600';
            }}
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-2xl font-bold text-gray-900 truncate pr-4">
              {product.name}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {/* Add to favorites logic */}}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title={t('Bəyəndiklərə əlavə et', 'Add to favorites')}
              >
                <Heart className="h-5 w-5" />
              </button>
              <button
                onClick={() => {/* Share logic */}}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title={t('Paylaş', 'Share')}
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-hidden">
            {/* Image Section */}
            <div className="lg:w-1/2 p-6 bg-gray-50">
              <div className="relative">
                {/* Main Image */}
                <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/400/400';
                    }}
                  />
                  
                  {/* Zoom Button */}
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-70"
                    title={t('Böyüt', 'Zoom')}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-70"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-70"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? 'border-blue-500 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/64/64';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:w-1/2 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Price Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-green-600">
                        {formatPrice(product.price, product.currency)}
                      </p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-lg text-gray-500 line-through">
                          {formatPrice(product.originalPrice, product.currency)}
                        </p>
                      )}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Store className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t('Mağaza', 'Store')}</p>
                      <p className="font-medium">{product.store?.name || t('Məlum deyil', 'Unknown')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t('Kateqoriya', 'Category')}</p>
                      <p className="font-medium">{product.categoryName || t('Təyin edilməyib', 'Not specified')}</p>
                    </div>
                  </div>

                  {product.brand && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">{t('Brend', 'Brand')}</p>
                        <p className="font-medium">{product.brand}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t('Əlavə edilib', 'Added')}</p>
                      <p className="font-medium text-sm">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {t('Təsvir', 'Description')}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Product URL */}
                {product.url && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {t('Məhsul linki', 'Product Link')}
                    </h3>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate max-w-xs">{product.url}</span>
                    </a>
                  </div>
                )}

                {/* Additional Details */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t('Əlavə məlumatlar', 'Additional Details')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">{t('Məhsul ID', 'Product ID')}:</span>
                      <span className="ml-2 font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                        {product._id}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('Son yenilənmə', 'Last updated')}:</span>
                      <span className="ml-2">{formatDate(product.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      <ImageModal />
    </>
  );
};

export default ProductDetailModal;