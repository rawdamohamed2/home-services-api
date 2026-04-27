import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./core/config/db.js";
import './modules/categories/Category.model.js';
import authRoutes from './modules/auth/auth.route.js';
import workerRoutes from './modules/workers/worker.route.js';
import userRoutes from './modules/users/user.route.js';
import categoryRoutes from './modules/categories/category.route.js'
import mongoose from "mongoose";
import serviceRoutes from "./modules/services/service.route.js";
import adminRoutes from "./modules/admins/admin.route.js";
import roleRoutes from "./modules/rolePermissions/rolePermission.route.js";

const app = express();


connectDB();

app.use(express.json());

console.log('📊 Registered models:', mongoose.modelNames());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);

app.use('/api/services', serviceRoutes);
app.use('/api/admins', adminRoutes);

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/api/role-permissions",roleRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to serviGo Api',
        status: 'success'
    });
});

export default app;

