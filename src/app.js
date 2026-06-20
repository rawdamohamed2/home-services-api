import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import connectDB from "./core/config/db.js";
import "./modules/categories/Category.model.js";
import authRoutes from "./modules/auth/auth.route.js";
import workerRoutes from "./modules/workers/worker.route.js";
import userRoutes from "./modules/users/user.route.js";
import categoryRoutes from "./modules/categories/category.route.js";
import serviceRoutes from "./modules/services/service.route.js";
import adminRoutes from "./modules/admins/admin.route.js";
import adminNotificationRoutes from "./modules/AdminNotification/Adminnotification.route.js";
import roleRoutes from "./modules/rolePermissions/rolePermission.route.js";
import bookingRoutes from "./modules/bookings/booking.route.js";
import notificationsRoutes from "./modules/notifications/Notification.routes.js";
import assignmentsRoutes from "./modules/bookingAssignment/bookingAssignment.route.js";
import paymentRouter from "./modules/payments/payment.route.js";
import workerWalletRouter from "./modules/wallet/workerWallet.route.js";
import userWalletRouter from "./modules/wallet/userWallet.route.js";
import withdrawalAdminRouter from "./modules/withdrawals/withdrawalAdmin.route.js";
import instapayRouter from "./modules/instapay/instapay.route.js";
import adminPaymentRouter from "./modules/adminPayments/adminPayment.route.js";
import subscriptionRouter from "./modules/SubscriptionPlans/subscription.route.js";
import subscriptionAdminRouter from "./modules/SubscriptionPlans/subscriptionAdmin.route.js";
import ChatRoutes from "./modules/chats/chat.route.js";
import TrackingRoutes from "./modules/Tracking system/tracking.routes.js";
import reviewRouter from "./modules/reviews/review.route.js";
import reviewAdminRouter from "./modules/reviews/reviewAdmin.route.js";
import searchRoutes from "./modules/search/search.route.js";

const app = express();
const httpServer = createServer(app);

connectDB();

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

console.log("📊 Registered models:", mongoose.modelNames());
app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/role-permissions", roleRoutes);
app.use("/api/payments", paymentRouter);
app.use("/api/wallet", workerWalletRouter);
app.use("/api/user/wallet", userWalletRouter);
app.use("/api/admin/payments/withdrawals", withdrawalAdminRouter);
app.use("/api/admin/payments/instapay", instapayRouter);
app.use("/api/admin/payments", adminPaymentRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/admin/subscriptions", subscriptionAdminRouter);
app.use("/api/chat", ChatRoutes);
app.use("/api/tracking", TrackingRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin/reviews", reviewAdminRouter);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to serviGo Api",
    status: "success",
  });
});

export { httpServer };
export default app;
