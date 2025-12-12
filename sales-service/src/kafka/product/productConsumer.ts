import { Kafka } from "kafkajs";
import { ProductCacheModel } from "../../infrastructure/mongoose-schemas/ProductCache.schema";

const kafka = new Kafka({
    clientId: "sales-service-product",
    brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "sales-product-group" });

export async function startProductInfoConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: "product.info.updated", fromBeginning: false });

    console.log("Sales Service listening on product.info.updated");

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value!.toString());
            const product = event.product;
            console.log("Received product info:", product);

            await ProductCacheModel.updateOne(
                { productId: product.productId },
                {
                    $set: {
                        name: product.name,
                        productId:product._id,
                        brand: product.brand,
                        category: product.category,
                        costPrice: product.costPrice,
                        sellingPrice: product.sellingPrice,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }
    });
}
