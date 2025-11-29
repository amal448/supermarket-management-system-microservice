import mongoose, { Schema, Document, Types } from "mongoose";

export interface ProductDocument extends Document {
  
  name: string;
  sku: string;
  category: string;
  unit: string;         // kg, g, pcs
  brand: string;
  costPrice: number;
  sellingPrice: number;
  createdBy: string; // Admin who added
}

const validCategories = ["stationery", "clothing", "grocery", "electronics"];

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, enum: validCategories },
    unit: { type: String, required: true, trim: true },
    brand: { type: String,required: true, trim: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 }, { unique: true });

export const ProductModel = mongoose.model<ProductDocument>("Product", productSchema);
