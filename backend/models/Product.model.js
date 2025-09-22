const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  sizeName: {
    type: String,
    required: true,
    trim: true
  },
  onStock: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceInRubles: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  discountedPrice: {
    type: Number,
    default: null,
    min: 0
  },
  imageUrl: {
    type: [String],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  sizes: {
    type: [sizeSchema],
    default: []
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ storeName: 1, categoryName: 1 });
productSchema.index({ name: 1, brand: 1, storeName: 1 }, { unique: true });
productSchema.index({ storeName: 1, createdAt: -1 }); // For store products with sorting
productSchema.index({ brand: 1 }); // For brand filtering
productSchema.index({ categoryName: 1 }); // For category filtering

module.exports = mongoose.model("Product", productSchema);