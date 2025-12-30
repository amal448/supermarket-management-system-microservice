import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";
import { sendAnalyticsUpdatedEvent, sendDashboardUpdateEvent, sendSaleCompletedEvent } from "../../kafka/producer";

import { getSalesSummary } from "../use-cases/GetSalesUseCase";
import { SalesService } from "./sales.service";
const saleRepo = new SaleRepository();
const salesservice = new SalesService(saleRepo);

interface CompletedSalePayload {
  saleId: string;
  branchId: string;
  cashierId: string;
  items: {
    productId: string;
    quantity: number;
    freeUnits?: number;
  }[];
  finalAmount: number;
}

export async function processCompletedSale(payload: CompletedSalePayload) {
  const { saleId, branchId, cashierId, items, finalAmount } = payload;

  // 1️⃣ Update Branch Summary
  const branchSummary = await new getSalesSummary(saleRepo).execute(branchId);
  await sendDashboardUpdateEvent({
    type: "BRANCH_UPDATE",
    branchId,
    summary: branchSummary
  });

  // 2️⃣ Update Global Summary
  const globalSummary = await new getSalesSummary(saleRepo).execute();
  await sendDashboardUpdateEvent({
    type: "GLOBAL_UPDATE",
    summary: globalSummary
  });

  // 3️⃣ Emit Kafka sale.completed event
  console.log("Kafka start;");
  await sendSaleCompletedEvent({
    saleId,
    branchId,
    cashierId,
    items: items.map((i) => ({
      productId: i.productId,
      qty: Number(i.quantity),
      freeUnits: Number(i.freeUnits) || 0
    })),
    finalAmount,
    timestamp: new Date().toISOString(),
  });

  // 4️⃣ Emit Analytics Event
  const analytics = await salesservice.getAnalytics(
    branchId,
    new Date(new Date().getFullYear(), new Date().getMonth(), 1), // start of month
    new Date(),
    "daily"
  );
  await sendAnalyticsUpdatedEvent(analytics);

  console.log("Kafka event sales.completed sent");
}
