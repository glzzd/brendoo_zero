const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true, 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [/\S+@\S+\.\S+/, "Geçerli bir email adresi giriniz"], 
        },
        password: {
            type: String,
            required: true,
        },
        refreshTokens: [
            {
                token: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

UserSchema.index({ email: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
