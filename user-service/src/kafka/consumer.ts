import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "user-service",
    brokers: ["localhost:9092"],
})
const consumer = kafka.consumer({ groupId: "user-service" });

export async function startStockConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: "stock.updated" });

    consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value!.toString());
            console.log("Received stock update:", data);

            // send to socket instead of API refresh
            global.io.to(data.branchId).emit("stock-updated", data);
            console.log("📢 Emitted stock update to branch:", data.branchId);
        },
    });
}
