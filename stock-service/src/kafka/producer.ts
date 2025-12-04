import { Kafka } from "kafkajs";

export const kafka = new Kafka({
    clientId: "stock-service",
    brokers: ["localhost:9092"]
})

export const producer = kafka.producer()

export async function connectProducer() {
    await producer.connect();
    console.log("Stock Producer connected");
}

export async function sendStockUpdate(branchId: string, items: any[]) {
    console.log("stock acknowledged to user");
    
    await producer.send({
        topic: "stock.updated",
        messages: [
            {
                value: JSON.stringify({
                    branchId,
                    items,
                    timestamp: new Date().toISOString(),
                })
            }
        ]
    })
}