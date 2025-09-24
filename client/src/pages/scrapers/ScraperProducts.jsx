import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Search, ExternalLink, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const ScraperProducts = () => {
  const { scraperId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scraperInfo, setScraperInfo] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [productSpecificScrapers, setProductSpecificScrapers] = useState([]);
  const [selectedScraper, setSelectedScraper] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5009/api/v1';

  useEffect(() => {
    console.log('useEffect triggered, scraperId:', scraperId);
    console.log('token from context:', token);
    console.log('token from localStorage:', localStorage.getItem('token'));
    fetchProducts();
    fetchProductSpecificScrapers();
  }, [scraperId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const currentToken = token || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/products?search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data.products || []);
        setScraperInfo(data.data.scraper);
      } else {
        toast.error('Məhsullar yüklənərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Məhsullar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const fetchProductSpecificScrapers = async () => {
    try {
      const currentToken = token || localStorage.getItem('token');
      console.log('Fetching product specific scrapers with token:', currentToken ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/product-specific/list`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      const data = await response.json();
      console.log('Product specific scrapers response:', data);
      
      if (response.ok && data.success) {
        console.log('Setting product specific scrapers:', data.data);
        setProductSpecificScrapers(data.data || []);
      } else {
        console.error('Error fetching product specific scrapers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching product specific scrapers:', error);
    }
  };

  const handleProductScrape = async (product, productIndex) => {
    console.log('handleProductScrape called with:', { product, productIndex });
    
    try {
      // Məhsul spesifik scraper-ları yenidən yüklə
      await fetchProductSpecificScrapers();
      
      if (productSpecificScrapers.length === 0) {
        console.log('No product specific scrapers found, showing error');
        toast.error('Məhsul spesifik scraper tapılmadı. Zəhmət olmasa məhsul spesifik scraper yaradın.');
        return;
      }

      // İlk məhsul spesifik scraper'ı seç
       const scraper = productSpecificScrapers[0];
       console.log('Using scraper:', scraper);
 
       // API çağırısı
      const currentToken = token || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/${scraper._id}/products/${productIndex}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productName: product.name,
          productUrl: product.link
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || `${product.name} üçün məhsul scraper-i başladıldı`);
      } else {
        toast.error(data.message || 'Məhsul scraper-i başladılarkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error starting product scraper:', error);
      toast.error('Məhsul scraper-i başladılarkən xəta baş verdi');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Yüklənir...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/scrapers/list')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {scraperInfo?.name || 'Məhsullar'}
            </h1>
            <span className="text-sm text-gray-500">
              {filteredProducts.length} məhsul tapıldı
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Gizlət
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Göstər
            </>
          )}
        </Button>
      </div>



      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Məhsul axtar..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </form>

      {/* Products Dropdown */}
      <div className="bg-white border rounded-lg shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">
            Məhsullar ({filteredProducts.length})
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="border-t">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Heç bir məhsul tapılmadı
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.map((product, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {product.name}
                        </h3>
                        {product.logo && (
                          <div className="mt-2">
                            <img
                              src={product.logo}
                              alt={product.name}
                              className="h-8 w-auto object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex gap-2">
                        {product.link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(product.link, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Bax
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProductScrape(product, index)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          Məhsulları al
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScraperProducts;