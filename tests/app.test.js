import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';

// Import setup (which handles DB)
import './setup.js';

describe('GET /', () => {
    it('should return 200 status', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });
});

// Ensure all connections are closed after tests
afterAll(async () => {
    // Close any open mongoose connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    // If there was a server started manually (unlikely due to conditional start), close it
    // Since we use supertest, no extra server is running
});