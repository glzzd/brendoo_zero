import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ExternalLink, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const ScraperProductsInline = ({ scraperId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [productSpecificScrapers, setProductSpecificScrapers] = useState([]);
  const [selectedScraper, setSelectedScraper] = useState('');
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingQueue, setScrapingQueue] = useState([]);
  const [completedScraping, setCompletedScraping] = useState([]);
  const { token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

  const fetchProducts = async () => {
    if (!isExpanded || products.length > 0) return;
    
    try {
      setLoading(true);
      const currentToken = token || localStorage.getItem('token');
      
      console.log('Fetching products for scraper:', scraperId);
      const response = await fetch(`${API_BASE_URL}/scrapers/${scraperId}/products?limit=100`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setProducts(data.data.products || []);
        console.log('Products set:', data.data.products?.length || 0);
      } else {
        console.error('API Error:', data.message);
        toast.error(data.message || 'Məhsullar yüklənərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Məhsullar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeAllProducts = async () => {
    if (!selectedScraper) {
      toast.error('Zəhmət olmasa məhsul spesifik scraper seçin');
      return;
    }

    if (products.length === 0) {
      toast.error('Scraping üçün məhsul tapılmadı');
      return;
    }

    setIsScrapingAll(true);
    setScrapingQueue([...products]);
    setCompletedScraping([]);
    
    toast.info(`${products.length} məhsul üçün scraping başladılır...`);

    // Hər məhsul üçün ayrıca scraping başlat
    const scrapingPromises = products.map(async (product, index) => {
      try {
        console.log(`Debug: Starting scrape for ${product.name}`);
        
        if (!selectedScraper) {
          throw new Error('Scraper seçilməyib');
        }

        const currentToken = token || localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/scrapers/start-product-scraper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scraperId: selectedScraper,
            productUrl: product.link
          })
        });

        // Response content type yoxla
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error(`${product.name} - Non-JSON response:`, textResponse.substring(0, 200));
          throw new Error(`Server HTML səhifəsi qaytardı (Status: ${response.status})`);
        }

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`${product.name} scraping başladı:`, data.jobId);
          toast.success(`${product.name} scraping başladı`);
          
          // Nəticələri yoxlamaq üçün polling başlat
          const checkResults = async (attempts = 0) => {
            if (attempts >= 20) { // 20 cəhd = 2 dəqiqə
              toast.error(`${product.name} üçün nəticə tapılmadı (timeout)`);
              return;
            }
            
            try {
              const results = await checkScraperResults(data.outputFileName, product.name);
              if (results) {
                setCompletedScraping(prev => [...prev, product]);
                setScrapingQueue(prev => prev.filter(p => p.url !== product.url));
                toast.success(`${product.name} tamamlandı - ${results.total_products} məhsul tapıldı!`);
              } else {
                // 6 saniyə sonra yenidən yoxla
                setTimeout(() => checkResults(attempts + 1), 6000);
              }
            } catch (error) {
              console.error(`Error checking results for ${product.name}:`, error);
              setTimeout(() => checkResults(attempts + 1), 6000);
            }
          };
          
          // 10 saniyə sonra nəticələri yoxlamağa başla
          setTimeout(() => checkResults(), 10000);
          
        } else {
          throw new Error(data.message || 'Scraping başladılmadı');
        }
        
      } catch (error) {
        console.error(`Error scraping ${product.name}:`, error);
        toast.error(`${product.name} scraping xətası: ${error.message}`);
        setScrapingQueue(prev => prev.filter(p => p.url !== product.url));
      }
    });

    // Bütün scraping proseslərinin başlamasını gözlə
    await Promise.allSettled(scrapingPromises);
    
    // 5 dəqiqə sonra scraping prosesini bitir
    setTimeout(() => {
      setIsScrapingAll(false);
      toast.info('Scraping prosesi tamamlandı');
    }, 300000); // 5 dəqiqə
  };

  const fetchProductSpecificScrapers = async () => {
    try {
      const currentToken = token || localStorage.getItem('token');
      console.log('Fetching product-specific scrapers with token:', currentToken ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/product-specific/list`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Product-specific scrapers response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Product-specific scrapers data:', data);
        setProductSpecificScrapers(data.data || []);
        console.log('Product-specific scrapers set:', data.data?.length || 0);
      } else {
        console.error('Failed to fetch product-specific scrapers');
      }
    } catch (error) {
      console.error('Error fetching product-specific scrapers:', error);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, isExpanded:', isExpanded);
    if (isExpanded) {
      fetchProducts();
      fetchProductSpecificScrapers();
    }
  }, [isExpanded]);

  // İlk scraper-i avtomatik seç
  useEffect(() => {
    if (productSpecificScrapers.length > 0 && !selectedScraper) {
      console.log('Auto-selecting first scraper:', productSpecificScrapers[0]);
      setSelectedScraper(productSpecificScrapers[0]._id);
    }
  }, [productSpecificScrapers, selectedScraper]);

  const handleToggle = () => {
    console.log('Toggle expanded clicked, current state:', isExpanded);
    console.log('Scraper ID:', scraperId);
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      fetchProducts();
    }
  };

  const checkScraperResults = async (outputFile, productName) => {
    try {
      const currentToken = token || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/results/${outputFile}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Response content type yoxla
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`${productName} - Results Non-JSON response:`, textResponse.substring(0, 200));
        throw new Error(`Results server HTML səhifəsi qaytardı (Status: ${response.status})`);
      }

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Scraper nəticələri:', data.data);
        toast.success(`${productName}: ${data.data.total_products} məhsul tapıldı!`);
        return data.data;
      } else {
        console.log('Nəticələr hələ hazır deyil:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error checking scraper results:', error);
      return null;
    }
  };

  const handleProductScrape = async (product, productIndex) => {
    console.log('=== handleProductScrape Debug ===');
    console.log('product:', product);
    console.log('productIndex:', productIndex);
    console.log('selectedScraper:', selectedScraper);
    console.log('productSpecificScrapers:', productSpecificScrapers);
    console.log('productSpecificScrapers length:', productSpecificScrapers.length);
    
    if (!selectedScraper) {
      toast.error('Zəhmət olmasa məhsul spesifik scraper seçin');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/scrapers/${selectedScraper}/products/${productIndex}/scrape`, {
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
        
        // 10 saniyə sonra nəticələri yoxla
        setTimeout(async () => {
          const results = await checkScraperResults(data.data.outputFile, product.name);
          if (!results) {
            // 20 saniyə sonra yenidən yoxla
            setTimeout(async () => {
              await checkScraperResults(data.data.outputFile, product.name);
            }, 20000);
          }
        }, 10000);
      } else {
        toast.error(data.message || 'Məhsul scraper-i başladılarkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error starting product scraper:', error);
      toast.error('Məhsul scraper-i başladılarkən xəta baş verdi');
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-700">
          Məhsulları göstər
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 border rounded-lg bg-white">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Yüklənir...
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Heç bir məhsul tapılmadı
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-4">
              {/* Məhsul Spesifik Scraper Seçimi */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Məhsul Spesifik Scraper Seçin:
                </label>
                <Select value={selectedScraper} onValueChange={setSelectedScraper}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Scraper seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productSpecificScrapers.map((scraper) => (
                      <SelectItem key={scraper._id} value={scraper._id}>
                        {scraper.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bütün Məhsulları Scrape Et Düyməsi */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Button
                  onClick={handleScrapeAllProducts}
                  disabled={isScrapingAll || !selectedScraper}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isScrapingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scraping... ({completedScraping.length}/{products.length})
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Bütün Məhsulları Al ({products.length} məhsul)
                    </>
                  )}
                </Button>
                {isScrapingAll && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tamamlanan: {completedScraping.length}</span>
                      <span>Qalan: {scrapingQueue.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedScraping.length / products.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Logo */}
                    <div className="flex justify-center mb-3">
                      {product.logo ? (
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="h-12 w-auto object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-lg"
                        style={{ display: product.logo ? 'none' : 'flex' }}
                      >
                        {product.name.charAt(0)}
                      </div>
                    </div>
                    
                    {/* Brand Name */}
                    <h5 className="font-semibold text-gray-900 text-center mb-3 text-sm">
                      {product.name}
                    </h5>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {product.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.link, '_blank')}
                          className="w-full flex items-center justify-center gap-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Səhifəyə get
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProductScrape(product, index)}
                        disabled={isScrapingAll}
                        className="w-full flex items-center justify-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Download className="h-3 w-3" />
                        Məhsulları al
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {products.length > 0 && (
                <div className="mt-4 p-3 text-center bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    Cəmi {products.length} brend göstərilir
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScraperProductsInline;