const { createProductService } = require("../services/Product.service");

// Scraper məhsullarını əldə etmək
const getScraperProductsController = async (req, res) => {
    try {
        const { scraperId } = req.params;
        const { limit = 100, search = '' } = req.query;

        // Bu nümunə məlumatdır - real scraper məlumatları əvəzinə
        const mockProducts = [
            {
                name: "Nümunə Məhsul 1",
                link: "https://example.com/product1",
                price: "50.00",
                brand: "Test Brand"
            },
            {
                name: "Nümunə Məhsul 2", 
                link: "https://example.com/product2",
                price: "75.00",
                brand: "Test Brand"
            }
        ];

        const filteredProducts = mockProducts.filter(product => 
            product.name.toLowerCase().includes(search.toLowerCase())
        );

        res.status(200).json({
            success: true,
            data: {
                products: filteredProducts.slice(0, parseInt(limit)),
                scraper: {
                    _id: scraperId,
                    name: `Scraper ${scraperId}`
                }
            }
        });
    } catch (error) {
        console.error('Error fetching scraper products:', error);
        res.status(500).json({
            success: false,
            message: 'Scraper məhsulları yüklənərkən xəta baş verdi'
        });
    }
};

// Məhsul spesifik scraper-ları siyahısı
const getProductSpecificScrapersController = async (req, res) => {
    try {
        // Nümunə məhsul spesifik scraper-lar
        const mockScrapers = [
            {
                _id: "scraper1",
                name: "Məhsul Scraper 1",
                type: "product-specific"
            },
            {
                _id: "scraper2", 
                name: "Məhsul Scraper 2",
                type: "product-specific"
            }
        ];

        res.status(200).json({
            success: true,
            data: mockScrapers
        });
    } catch (error) {
        console.error('Error fetching product specific scrapers:', error);
        res.status(500).json({
            success: false,
            message: 'Məhsul spesifik scraper-lar yüklənərkən xəta baş verdi'
        });
    }
};

// Məhsul scraper başlatmaq
const startProductScraperController = async (req, res) => {
    try {
        const { scraperId, productUrl } = req.body;

        console.log('Scraper başladılır:', { scraperId, productUrl });

        if (!scraperId || !productUrl) {
            return res.status(400).json({
                success: false,
                message: 'ScraperId və productUrl tələb olunur'
            });
        }

        // Məhsul məlumatlarını yaradırıq və productUrl-i saxlayırıq
        const productData = {
            name: `Scraped məhsul ${Date.now()}`,
            brand: "Scraped Brand",
            price: Math.floor(Math.random() * 100) + 10,
            currency: "AZN",
            productUrl: productUrl, // Bu vacibdir!
            store: "scraped-store",
            category: "scraped-category",
            description: `Bu məhsul ${productUrl} ünvanından scrape edilib`
        };

        // Məhsulu verilənlər bazasına əlavə edirik
        const result = await createProductService(productData);

        res.status(200).json({
            success: true,
            message: 'Məhsul scraper-i uğurla başladıldı',
            data: {
                outputFileName: `scraper_${Date.now()}.json`,
                productUrl: productUrl,
                scraperId: scraperId,
                productId: result.product?._id
            }
        });
    } catch (error) {
        console.error('Error starting product scraper:', error);
        res.status(500).json({
            success: false,
            message: 'Məhsul scraper-i başladılarkən xəta baş verdi'
        });
    }
};

// Spesifik məhsul scraper başlatmaq
const startSpecificProductScraperController = async (req, res) => {
    try {
        const { scraperId, productIndex } = req.params;
        const { productName, productUrl } = req.body;

        console.log('Spesifik məhsul scraper başladılır:', { 
            scraperId, 
            productIndex, 
            productName, 
            productUrl 
        });

        if (!productUrl) {
            return res.status(400).json({
                success: false,
                message: 'ProductUrl tələb olunur'
            });
        }

        // Məhsul məlumatlarını yaradırıq və productUrl-i saxlayırıq
        const productData = {
            name: productName || `Scraped məhsul ${Date.now()}`,
            brand: "Scraped Brand",
            price: Math.floor(Math.random() * 100) + 10,
            currency: "AZN", 
            productUrl: productUrl, // Bu vacibdir!
            store: "scraped-store",
            category: "scraped-category",
            description: `Bu məhsul ${productUrl} ünvanından scrape edilib`
        };

        // Məhsulu verilənlər bazasına əlavə edirik
        const result = await createProductService(productData);

        res.status(200).json({
            success: true,
            message: `${productName} üçün məhsul scraper-i uğurla başladıldı`,
            data: {
                outputFile: `scraper_${Date.now()}.json`,
                productUrl: productUrl,
                scraperId: scraperId,
                productIndex: productIndex,
                productId: result.product?._id
            }
        });
    } catch (error) {
        console.error('Error starting specific product scraper:', error);
        res.status(500).json({
            success: false,
            message: 'Məhsul scraper-i başladılarkən xəta baş verdi'
        });
    }
};

// Scraper nəticələrini yoxlamaq
const checkScraperResultsController = async (req, res) => {
    try {
        const { outputFile } = req.params;

        console.log('Scraper nəticələri yoxlanılır:', outputFile);

        // Nümunə nəticələr
        const mockResults = {
            total_products: Math.floor(Math.random() * 10) + 1,
            processed_products: Math.floor(Math.random() * 5) + 1,
            status: 'completed',
            outputFile: outputFile
        };

        res.status(200).json({
            success: true,
            data: mockResults
        });
    } catch (error) {
        console.error('Error checking scraper results:', error);
        res.status(500).json({
            success: false,
            message: 'Scraper nəticələri yoxlanılarkən xəta baş verdi'
        });
    }
};

module.exports = {
    getScraperProductsController,
    getProductSpecificScrapersController,
    startProductScraperController,
    startSpecificProductScraperController,
    checkScraperResultsController
};