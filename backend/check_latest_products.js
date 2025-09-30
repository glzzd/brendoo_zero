require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product.model');

async function checkLatestProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Son yaradılan məhsulları tap
        const products = await Product.find().sort({createdAt: -1}).limit(5);
        
        console.log(`\nSon ${products.length} məhsul:`);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - URL: "${product.productUrl}"`);
        });
        
        // productUrl sahəsi dolu olan məhsulları tap
        const productsWithUrl = await Product.find({productUrl: {$ne: ''}});
        console.log(`\nProductUrl sahəsi dolu olan məhsullar: ${productsWithUrl.length}`);
        
        if (productsWithUrl.length > 0) {
            console.log('Dolu URL-lər:');
            productsWithUrl.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - URL: "${product.productUrl}"`);
            });
        }
        
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkLatestProducts();