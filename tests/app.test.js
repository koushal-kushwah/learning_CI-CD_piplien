import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";

describe("GET /", () => {
    it("should return 200 status", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
    });
});

afterAll(async () => {
    await mongoose.connection.close(); // ✅ DB close
});