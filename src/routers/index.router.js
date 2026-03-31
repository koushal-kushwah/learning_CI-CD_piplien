import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import adminRouter from "./admin.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/admin", adminRouter);

export default router;