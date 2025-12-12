import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "user-service",
    brokers: ["localhost:9092"],
})
const consumer = kafka.consumer({ groupId: "user-service" });

export async function startStockConsumer() {
    await consumer.connect();
    // ✔ Subscribe to stock updates
    await consumer.subscribe({ topic: "stock.updated" });

    // ✔ Subscribe to dashboard sales updates
    await consumer.subscribe({ topic: "sales.dashboard.updated" });
    // ✔ Subscribe to sales.analytics.updated
    await consumer.subscribe({ topic: "sales.analytics.updated" });

    consumer.run({
        eachMessage: async ({ topic, message }) => {
            const data = JSON.parse(message.value!.toString());

            if (topic === "stock.updated") {
                console.log("📦 Received stock update:", data);

                global.io.to(data.branchId).emit("stock-updated", data);
                console.log("📢 Emitted stock update to branch:", data.branchId);
            }

            if (topic === "sales.dashboard.updated") {
                console.log("📊 Received dashboard sales data:", data);

                // Emit to ALL admins (or a room based on your logic)
                global.io.emit("dashboard-sales-update", data);

                console.log("📤 Emitted dashboard-sales-update to all admins");
            }
            if (topic === "sales.analytics.updated") {
                console.log("📊 Received sales.analytics.updated:", data);

                // Emit to ALL admins (or a room based on your logic)
                global.io.emit("analytics_update", data);
                console.log("📡 Socket emitted: analytics_update");
            }
        },
    });
}
