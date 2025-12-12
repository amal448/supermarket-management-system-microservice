import mongoose, { Schema, Document } from "mongoose";

export interface ProductCacheDocument extends Document {
    productId: string;
    name: string;
    brand: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    updatedAt: Date;
}

const ProductCacheSchema = new Schema<ProductCacheDocument>({
    productId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
});

export const ProductCacheModel = mongoose.model<ProductCacheDocument>(
    "ProductCache",
    ProductCacheSchema
);
