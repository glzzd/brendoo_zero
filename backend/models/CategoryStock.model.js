const mongoose = require("mongoose");

const CategoryStockSchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            trim: true,
        },
        storeName: {
            type: String,
            required: true,
            trim: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    { timestamps: true }
);

// Unique index - aynı mağazanın aynı kategorisi tekrar eklenemez
CategoryStockSchema.index({ categoryName: 1, storeName: 1 }, { unique: true });
CategoryStockSchema.index({ storeId: 1 });
CategoryStockSchema.index({ addedBy: 1 });

module.exports = mongoose.model("CategoryStock", CategoryStockSchema);