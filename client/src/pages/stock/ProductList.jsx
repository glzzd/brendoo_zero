import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Eye, Package, Store, Tag, Calendar, User, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import ProductDetailModal from '../../components/modals/ProductDetailModal';
import XmlExportModal from '../../components/modals/XmlExportModal';

const ProductList = () => {
  const { language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    storeId: '',
    categoryName: '',
    brand: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 10
  });
  const [stores, setStores] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isXmlExportModalOpen, setIsXmlExportModalOpen] = useState(false);

  // Fetch products
  const fetchProducts = async (page = 1, searchQuery = '', filterParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (pagination?.limit || 10).toString(),
        ...(searchQuery && searchQuery.trim() && { search: searchQuery.trim() }),
        ...filterParams
      });

      const response = await fetch(`http://localhost:5001/api/v1/products-stock?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Məhsullar yüklənərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Məhsullar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stores for filter dropdown
  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/store', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStores(data.data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  // Handle search with proper debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set new timeout for debounce
    window.searchTimeout = setTimeout(() => {
      fetchProducts(1, value, filters);
    }, 300);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchProducts(1, searchTerm, newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchProducts(newPage, searchTerm, filters);
  };

  // Handle product view
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Close product modal
  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
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

  // Format price with currency support
  const formatPrice = (price, currency = 'AZN') => {
    // Handle null, undefined, or NaN values
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
      console.warn('Error formatting price:', error);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Məhsul Siyahısı
          </h1>
          <p className="text-gray-600 mt-1">
            Stokdakı bütün məhsulları idarə edin
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtrlər
          </button>
          
          <button
            onClick={() => setIsXmlExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            XML Export
          </button>
         
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Məhsul adı ilə axtar..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mağaza
                </label>
                <select
                  value={filters.storeId}
                  onChange={(e) => handleFilterChange('storeId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Bütün mağazalar</option>
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kateqoriya
                </label>
                <input
                  type="text"
                  placeholder="Kateqoriya adı"
                  value={filters.categoryName}
                  onChange={(e) => handleFilterChange('categoryName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brend
                </label>
                <input
                  type="text"
                  placeholder="Brend adı"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Məhsul tapılmadı
            </h3>
            <p className="text-gray-600">
              Axtarış kriteriyalarınıza uyğun məhsul yoxdur
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Məhsul
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mağaza
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kateqoriya
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qiymət
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yaradılma / Yenilənmə
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Əməliyyatlar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                  src={(() => {
                                    const imgSrc = product.images[0];
                                    if (!imgSrc) return "";
                                    
                                    // Clean the URL
                                    const cleanUrl = (imgSrc || "").toString().trim().replace(/^["'`\s]+|["'`\s]+$/g, "");
                                    
                                    // If already a data URL, return as is
                                    if (cleanUrl.startsWith("data:")) return cleanUrl;
                                    
                                    // If HTTP URL, return as is
                                    if (cleanUrl.startsWith("http")) return cleanUrl;
                                    
                                    // If base64 string, convert to data URL
                                    if (
                                      cleanUrl.startsWith("/9j/") ||
                                      cleanUrl.startsWith("iVBOR") ||
                                      cleanUrl.startsWith("R0lGOD") ||
                                      cleanUrl.startsWith("UklGR") ||
                                      cleanUrl.match(/^[A-Za-z0-9+/=]+$/)
                                    ) {
                                      return `data:image/jpeg;base64,${cleanUrl}`;
                                    }
                                    
                                    return cleanUrl;
                                  })()}
                                  alt={product.name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm border border-gray-200"
                                style={{ display: (product.images && product.images.length > 0) ? 'none' : 'flex' }}
                              >
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.brand}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Store className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {product.store || 'Bilinməyən'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category || 'Kateqoriya yoxdur'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {product.price ? (
                              <div className="space-y-1">
                                <div>{formatPrice(product.price, product.currency)}</div>
                                {product.priceInRubles && product.currency !== 'RUB' && (
                                  <div className="text-xs text-gray-500">
                                    ≈ {formatPrice(product.priceInRubles, 'RUB')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Qiymət yoxdur</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                              <span className="text-xs text-gray-500 mr-2">Yaradılıb:</span>
                              <span className="text-sm font-medium">
                                {formatDate(product.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="h-2 w-2 bg-blue-400 rounded-full mr-2"></div>
                              <span className="text-xs text-gray-500 mr-2">Yenilənib:</span>
                              <span className="text-sm font-medium">
                                {formatDate(product.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewProduct(product)}
                              className="inline-flex items-center p-2 border border-transparent rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                              title="Bax"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Əvvəlki
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Növbəti
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{String(((pagination.currentPage - 1) * pagination.limit) + 1)}</span>
                      {' - '}
                      <span className="font-medium">
                        {String(Math.min(pagination.currentPage * pagination.limit, pagination.totalDocs))}
                      </span>
                      {' / '}
                      <span className="font-medium">{String(pagination.totalDocs)}</span>
                      {' nəticə'}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Əvvəlki
                      </button>
                      
                      {(() => {
                        const { currentPage, totalPages } = pagination;
                        const pages = [];
                        
                        // Always show first page
                        if (totalPages > 0) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                1 === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              1
                            </button>
                          );
                        }
                        
                        // Show ellipsis if needed
                        if (currentPage > 4) {
                          pages.push(
                            <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        
                        // Show pages around current page
                        const start = Math.max(2, currentPage - 1);
                        const end = Math.min(totalPages - 1, currentPage + 1);
                        
                        for (let i = start; i <= end; i++) {
                          if (i !== 1 && i !== totalPages) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  i === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                        }
                        
                        // Show ellipsis if needed
                        if (currentPage < totalPages - 3) {
                          pages.push(
                            <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        
                        // Always show last page if more than 1 page
                        if (totalPages > 1) {
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                totalPages === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {totalPages}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Növbəti
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {isProductModalOpen && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
        />
      )}

      {/* XML Export Modal */}
      {isXmlExportModalOpen && (
        <XmlExportModal
          isOpen={isXmlExportModalOpen}
          onClose={() => setIsXmlExportModalOpen(false)}
          stores={stores}
        />
      )}
    </div>
  );
};

export default ProductList;