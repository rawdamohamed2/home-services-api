import dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRoutes from './modules/auth/auth.routes.js';


const app = express();

app.use(express.json());

// هنا تحطي كل routes
// app.use("/api/users", userRoutes);

app.use('/api/auth', authRoutes);

export default app;