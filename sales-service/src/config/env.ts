import dotenv from 'dotenv';
dotenv.config();


export const env = {
port: process.env.PORT || '4000',
mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sales',
productsServiceUrl: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:5001'
};