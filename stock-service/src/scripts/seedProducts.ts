// src/scripts/seedProducts.ts
import mongoose from "mongoose";
import { ProductModel } from "../infrastructure/database/models/product.model";
// adjust path according to your structure

// ---------- CONFIGURE DB ----------
const MONGO_URI = process.env.MONGO_URI ||'mongodb://localhost:27017/stock-management' ;

// ---------- SKU GENERATOR (same as your service logic) ----------
function generateSKU(name: string, brand: string, unit: string) {
  const n = name.slice(0, 3).toUpperCase();
  const b = brand.slice(0, 3).toUpperCase();
  const u = unit.slice(0, 2).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${n}-${b}-${u}-${rand}`;
}

// ---------- SEED DATA ----------
export const seedProducts = [
  // 📌 Stationery
  {
    name: "Ball Pen",
    category: "stationery",
    unit: "pcs",
    brand: "Cello",
    costPrice: 5,
    sellingPrice: 10,
    createdBy: "seed-admin",
  },
  {
    name: "Notebook A5",
    category: "stationery",
    unit: "pcs",
    brand: "Classmate",
    costPrice: 25,
    sellingPrice: 40,
    createdBy: "seed-admin",
  },
  {
    name: "Stapler",
    category: "stationery",
    unit: "pcs",
    brand: "Kangaro",
    costPrice: 60,
    sellingPrice: 90,
    createdBy: "seed-admin",
  },
  {
    name: "Highlighter Pen",
    category: "stationery",
    unit: "pcs",
    brand: "Faber-Castell",
    costPrice: 20,
    sellingPrice: 35,
    createdBy: "seed-admin",
  },
  {
    name: "Drawing Book",
    category: "stationery",
    unit: "pcs",
    brand: "Navneet",
    costPrice: 30,
    sellingPrice: 50,
    createdBy: "seed-admin",
  },

  // 📌 Grocery
  {
    name: "Basmati Rice 1kg",
    category: "grocery",
    unit: "kg",
    brand: "India Gate",
    costPrice: 60,
    sellingPrice: 75,
    createdBy: "seed-admin",
  },
  {
    name: "Wheat Flour 1kg",
    category: "grocery",
    unit: "kg",
    brand: "Aashirvaad",
    costPrice: 40,
    sellingPrice: 55,
    createdBy: "seed-admin",
  },
  {
    name: "Sugar 1kg",
    category: "grocery",
    unit: "kg",
    brand: "Local",
    costPrice: 34,
    sellingPrice: 45,
    createdBy: "seed-admin",
  },
  {
    name: "Sunflower Oil 1L",
    category: "grocery",
    unit: "litre",
    brand: "Fortune",
    costPrice: 110,
    sellingPrice: 130,
    createdBy: "seed-admin",
  },
  {
    name: "Milk 500ml",
    category: "grocery",
    unit: "pack",
    brand: "Amul",
    costPrice: 24,
    sellingPrice: 28,
    createdBy: "seed-admin",
  },

  // 📌 Clothing
  {
    name: "Cotton T-Shirt",
    category: "clothing",
    unit: "pcs",
    brand: "USPA",
    costPrice: 200,
    sellingPrice: 350,
    createdBy: "seed-admin",
  },
  {
    name: "Jeans Pant",
    category: "clothing",
    unit: "pcs",
    brand: "Levis",
    costPrice: 900,
    sellingPrice: 1250,
    createdBy: "seed-admin",
  },
  {
    name: "Formal Shirt",
    category: "clothing",
    unit: "pcs",
    brand: "Peter England",
    costPrice: 600,
    sellingPrice: 900,
    createdBy: "seed-admin",
  },
  {
    name: "Cotton Socks",
    category: "clothing",
    unit: "pack",
    brand: "Jockey",
    costPrice: 40,
    sellingPrice: 60,
    createdBy: "seed-admin",
  },
  {
    name: "Sports Shorts",
    category: "clothing",
    unit: "pcs",
    brand: "Nike",
    costPrice: 300,
    sellingPrice: 500,
    createdBy: "seed-admin",
  },

  // 📌 Electronics
  {
    name: "Wireless Mouse",
    category: "electronics",
    unit: "pcs",
    brand: "Logitech",
    costPrice: 400,
    sellingPrice: 599,
    createdBy: "seed-admin",
  },
  {
    name: "Keyboard",
    category: "electronics",
    unit: "pcs",
    brand: "Dell",
    costPrice: 450,
    sellingPrice: 650,
    createdBy: "seed-admin",
  },
  {
    name: "Earphones",
    category: "electronics",
    unit: "pcs",
    brand: "Boat",
    costPrice: 300,
    sellingPrice: 499,
    createdBy: "seed-admin",
  },
  {
    name: "Power Bank 10000mAh",
    category: "electronics",
    unit: "pcs",
    brand: "Mi",
    costPrice: 800,
    sellingPrice: 999,
    createdBy: "seed-admin",
  },
  {
    name: "LED Bulb 12W",
    category: "electronics",
    unit: "pcs",
    brand: "Philips",
    costPrice: 80,
    sellingPrice: 120,
    createdBy: "seed-admin",
  },
];


async function runSeeder() {
  try {
    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected");

    for (const item of seedProducts) {
      // generate SKU until unique
      let sku: string;
      let existing;
      do {
        sku = generateSKU(item.name, item.brand, item.unit);
        existing = await ProductModel.findOne({ sku });
      } while (existing);

      const productData = { ...item, sku };

      await ProductModel.create(productData);
      console.log("✔ Seeded:", productData.name, "SKU:", sku);
    }

    console.log("\n🌱 Product seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

runSeeder();
