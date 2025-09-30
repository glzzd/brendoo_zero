const authRoutes = require("./Auth.routes");
const storeRoutes = require("./Store.routes");
const categoryStockRoutes = require("./CategoryStock.routes");
const productRoutes = require("./Product.routes");
const systemRoutes = require("./System.routes");
const scraperRoutes = require("./Scraper.routes");


module.exports={
    authRoutes,
    storeRoutes,
    categoryStockRoutes,
    productRoutes,
    systemRoutes,
    scraperRoutes
}