import { Kafka } from "kafkajs";

export const kafka = new Kafka({
    clientId: "stock-service-product",
    brokers: ["localhost:9092"]
});

export const productProducer = kafka.producer();

export async function connectProductProducer() {
    await productProducer.connect();
    console.log("Product Producer connected");
}

export async function sendProductInfoUpdate(product: any) {
    await productProducer.send({
        topic: "product.info.updated",
        messages: [
            { value: JSON.stringify({ product, timestamp: new Date().toISOString() }) }
        ]
    });
    console.log("Product info event sent:", product.name);
}
