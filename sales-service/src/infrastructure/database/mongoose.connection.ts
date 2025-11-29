import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';


export async function connectDB() {
mongoose.set('strictQuery', false);
await mongoose.connect(env.mongoUri);
logger.info('Connected to MongoDB');
}