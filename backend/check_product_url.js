const mongoose = require('mongoose');
const Product = require('./models/Product.model');

async function checkProductUrls() {
  try {
    await mongoose.connect('mongodb://localhost:27017/brendoo_zero');
    console.log('Connected to MongoDB');

    // productUrl sahəsi dolu olan məhsul tap
    const productWithUrl = await Product.findOne({productUrl: {$ne: ''}});
    console.log('Product with URL:', productWithUrl ? {
      name: productWithUrl.name,
      productUrl: productWithUrl.productUrl
    } : 'No product with URL found');

    // Statistikalar
    const emptyCount = await Product.countDocuments({productUrl: ''});
    const filledCount = await Product.countDocuments({productUrl: {$ne: ''}});
    const totalCount = await Product.countDocuments({});

    console.log('Products with empty URL:', emptyCount);
    console.log('Products with filled URL:', filledCount);
    console.log('Total products:', totalCount);

    // Son əlavə edilən məhsulları yoxla
    const recentProducts = await Product.find({}).sort({createdAt: -1}).limit(5);
    console.log('\nRecent products:');
    recentProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - URL: "${product.productUrl}"`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProductUrls();