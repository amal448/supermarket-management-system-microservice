import mongoose from "mongoose";
import {SaleModel} from "../src/infrastructure/mongoose-schemas/sale.schema";       // Adjust path if needed
import {SaleItemModel} from '../src/infrastructure/mongoose-schemas/saleItem.schema'

// CONFIG
const MONGO_URI = "mongodb://localhost:27017/sales-service"; // Replace with your DB
const BRANCH_ID = "692575d44e89038931f5296f";
const CASHIER_ID = "69292b0adaa291db27e84149";
const NUM_SALES = 10; // total sales to generate
const MAX_ITEMS_PER_SALE = 3;
const NUM_PRODUCTS = 10; // pretend you have 10 products

// UTILS
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedSales() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  for (let i = 0; i < NUM_SALES; i++) {
    // Random date within last 3 months
    const daysAgo = randomInt(0, 3);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    const subtotal = randomInt(100, 500);
    const productDiscount = randomInt(0, 50);
    const cartDiscount = randomInt(0, 20);
    const totalDiscount = productDiscount + cartDiscount;
    const finalAmount = subtotal - totalDiscount;

    const sale = await SaleModel.create({
      branchId: BRANCH_ID,
      cashierId: CASHIER_ID,
      subtotal,
      productDiscount,
      cartDiscount,
      totalDiscount,
      finalAmount,
      status: "COMPLETED",
      paymentMode: "CASH",
      discountsApplied: [],
      createdAt,
      updatedAt: createdAt,
    });

    const numItems = randomInt(1, MAX_ITEMS_PER_SALE);
    for (let j = 0; j < numItems; j++) {
      const quantity = randomInt(1, 5);
      const unitPrice = randomInt(10, 100);

      await SaleItemModel.create({
        saleId: sale._id,
        productId: `prod${randomInt(1, NUM_PRODUCTS)}`,
        unitPrice,
        quantity,
        appliedDiscountName: null,
        appliedDiscountAmount: 0,
        freeUnits: 0,
        total: unitPrice * quantity,
        createdAt,
      });
    }
  }

  console.log(`Seeded ${NUM_SALES} sales with sale items!`);
  mongoose.disconnect();
}

seedSales().catch((err) => {
  console.error("Error seeding sales:", err);
  mongoose.disconnect();
});
