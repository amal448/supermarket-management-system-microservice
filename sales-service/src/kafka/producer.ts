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
    console.log("inside send Sale CompleteEvent", data);

    await producer.send({
        topic: "sales.completed",
        messages: [{ value: JSON.stringify(data) }],
    });
}
//Sales Latest Data for send to user service
export async function sendDashboardUpdateEvent(data: any) {
    await producer.send({
        topic: "sales.dashboard.updated",
        messages: [{ value: JSON.stringify(data) }],
    });

    console.log("📤 Kafka: sales.dashboard.updated emitted");
}
export async function sendAnalyticsUpdatedEvent(data: any) {
    console.log("sendAnalyticsUpdatedEvent", data);

    await producer.send({
        topic: "sales.analytics.updated",
        messages: [{ value: JSON.stringify(data) }],
    });

    console.log("📊 Kafka: sales.analytics.updated emitted");
}

