const mongoose = require("mongoose");

// Size schema for product sizes
const sizeSchema = new mongoose.Schema({
  sizeName: {
    type: String,
    required: true,
    trim: true
  },
  onStock: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Main product schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['AZN', 'USD', 'EUR', 'RUB', 'TRY'],
    default: 'AZN',
    uppercase: true
  },
  priceInRubles: {
    type: Number,
    default: 0,
    min: 0
  },
  discountedPrice: {
    type: Number,
    default: null,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images) {
        return images.every(img => 
          typeof img === 'string' && 
          (img.startsWith('http') || img.startsWith('data:image/'))
        );
      },
      message: 'Images must be valid URLs or base64 data URLs'
    }
  },
  sizes: {
    type: [sizeSchema],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  productUrl: {
    type: String,
    trim: true,
    default: "",
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty URLs
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(url);
      },
      message: 'Product URL must be a valid URL'
    }
  },
  store: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  processedAt: {
    type: String,
    default: () => new Date().toLocaleTimeString('tr-TR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited'],
    default: 'in_stock'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating if product has discount
productSchema.virtual('hasDiscount').get(function() {
  return this.discountedPrice !== null && this.discountedPrice < this.price;
});

// Virtual for calculating discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.hasDiscount) return 0;
  return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
});

// Virtual for final price (discounted or regular)
productSchema.virtual('finalPrice').get(function() {
  return this.discountedPrice || this.price;
});

// Virtual for available sizes count
productSchema.virtual('availableSizesCount').get(function() {
  return this.sizes.filter(size => size.onStock).length;
});

// Indexes for better query performance
productSchema.index({ store: 1, category: 1 });
productSchema.index({ name: 1, brand: 1, store: 1 }, { unique: true });
productSchema.index({ brand: 1, store: 1 });
productSchema.index({ category: 1, store: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, stockStatus: 1 });

// Pre-save middleware to update processedAt
productSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.processedAt = new Date().toLocaleTimeString('tr-TR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  next();
});

// Static method to find products by store
productSchema.statics.findByStore = function(storeName) {
  return this.find({ 
    store: storeName.toLowerCase(),
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(categoryName, storeName = null) {
  const query = { 
    category: categoryName.toUpperCase(),
    isActive: true 
  };
  if (storeName) {
    query.store = storeName.toLowerCase();
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find products by brand
productSchema.statics.findByBrand = function(brandName, storeName = null) {
  const query = { 
    brand: brandName.toUpperCase(),
    isActive: true 
  };
  if (storeName) {
    query.store = storeName.toLowerCase();
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.stockStatus === 'in_stock' && this.availableSizesCount > 0;
};

// Instance method to get available sizes
productSchema.methods.getAvailableSizes = function() {
  return this.sizes.filter(size => size.onStock);
};

module.exports = mongoose.model("Product", productSchema);