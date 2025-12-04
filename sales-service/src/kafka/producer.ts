import { Kafka } from "kafkajs";

export const kafka = new Kafka({
    clientId: "sales-service",
    brokers: ["localhost:9092"]
})

export const producer = kafka.producer()

export async function connectProducer() {
    await producer.connect();
    console.log("Sales Producer connected");
}

export async function sendSaleCompletedEvent(data: any) {
    console.log("inside send Sale CompleteEvent",data);
    
    await producer.send({
        topic: "sales.completed",
        messages: [{ value: JSON.stringify(data) }],
    });
}