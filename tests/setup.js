import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ Test DB connected');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('✅ Test DB disconnected');
});