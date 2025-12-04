import { Kafka } from "kafkajs";
import { reduceStock } from "../services/stockService";

const kafka = new Kafka({
    clientId: "stock-service",
    brokers: ["localhost:9092"],
})

const consumer = kafka.consumer({ groupId: "stock-group" });

export async function startSaleConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: "sales.completed", fromBeginning: false })

    console.log("Stock Consumer listening to sales.completed");

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value!.toString());
            console.log("Received event:", event);

            await reduceStock(event.branchId, event.items);
        },
    });

}