const mongoose = require("mongoose");

const CategoryStockSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true },
    categoryType: { type: String, required: true, trim: true }, 
    storeName: { type: String, required: true, trim: true }, 
    img: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// aynı isimde kategori tekrar eklenmesin
CategoryStockSchema.index({ categoryName: 1 }, { unique: true });

module.exports =
  mongoose.models.CategoryStock ||
  mongoose.model("CategoryStock", CategoryStockSchema);
