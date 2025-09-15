const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        logo: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive"
        },
        endpoints: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            url: {
                type: String,
                required: true,
                trim: true
            },
            method: {
                type: String,
                enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
                default: "GET"
            },
            description: {
                type: String,
                trim: true
            }
        }],
    },
    { timestamps: true }
);

// Index for better search performance
StoreSchema.index({ name: "text", description: "text", category: "text" });
StoreSchema.index({ owner: 1 });
StoreSchema.index({ status: 1 });

module.exports = mongoose.model("Store", StoreSchema);