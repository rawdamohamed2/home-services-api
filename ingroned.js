// const Category = require("./src/models/Services/Category");
// const users = require("./src/models/Accounts/users");
// const WorkerProfile = require("./src/models/Accounts/WorkerProfile");
// const Service = require("./src/models/Services/Service");
// const bookings = require("./src/models/bookings/bookings");
// const bookingAssignment = require("./src/models/bookings/bookingAssignment");
// const Review = require("./src/models/bookings/Review");
// const Subscription = require("./src/models/Subscription System/Subscription");
// const SubscriptionPlan = require("./src/models/Subscription System/SubscriptionPlan");
// const ChatRoom = require("./src/models/Communication/ChatRoom");
// const Message = require("./src/models/Communication/Message");
// const Notification = require("./src/models/Communication/Notification");
//
// app.post("/add",async function(req,res){
//     const {name,image,isActive} = req.body;
//     const nCategory = new Category();
//     nCategory.name = name;
//     nCategory.image = image;
//     nCategory.isActive = isActive;
//     await nCategory.save();
//     res.json(nCategory);
// });
//
// app.post("/register", async (req, res) => {
//     try {
//         const user = await users.create(req.body);
//         res.json(user);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/worker/register", async (req, res) => {
//     try {
//         const worker = await WorkerProfile.create(req.body);
//         res.json(worker);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/service/add", async (req, res) => {
//     try {
//         const service = await Service.create(req.body);
//         res.json(service);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/booking/add", async (req, res) => {
//     try {
//         const booking = await bookings.create(req.body);
//         res.json(booking);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/booking-assignment/add", async (req, res) => {
//     try {
//         const assignment = await bookingAssignment.create(req.body);
//         res.json(assignment);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/review/add", async (req, res) => {
//     try {
//         const review = await Review.create(req.body);
//         res.json(review);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/subscription-plan/add", async (req, res) => {
//     try {
//         const plan = await SubscriptionPlan.create(req.body);
//         res.json(plan);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/subscription/add", async (req, res) => {
//     try {
//         const subscription = await Subscription.create(req.body);
//         res.json(subscription);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/chat-room/add", async (req, res) => {
//     try {
//         const chatRoom = await ChatRoom.create(req.body);
//         res.json(chatRoom);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
//
// app.post("/message/add", async (req, res) => {
//     try {
//         const message = await Message.create(req.body);
//         await ChatRoom.findByIdAndUpdate(req.body.chatRoom, { lastMessage: req.body.message });
//         res.json(message);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
// app.post("/notification/add", async (req, res) => {
//     try {
//         const notification = await Notification.create(req.body);
//         res.json(notification);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
// const Payment = require("./src/models/Wallet/WalletTransaction");
// const connectDB = require("./src/config/db");
// const express = require("express");
//
// const payments = [
//     {
//         "wallet": "65f1a9c2d4a1234567890100",
//         "amount": 250,
//         "type": "credit",
//         "source": "booking_payment",
//         "status": "completed",
//         "referenceId": "65f1a9c2d4a1234567890007",
//         "note": "Payment received for bookings #123"
//     },
//     {
//         "wallet": "65f1a9c2d4a1234567890100",
//         "amount": 100,
//         "type": "debit",
//         "source": "withdrawal",
//         "status": "completed",
//         "referenceId": "65f1a9c2d4a1234567890010",
//         "note": "Withdrawal to bank account"
//     },
//     {
//         "wallet": "65f1a9c2d4a1234567890101",
//         "amount": 500,
//         "type": "credit",
//         "source": "wallet_topup",
//         "status": "completed",
//         "note": "Topup from card"
//     },
//     {
//         "wallet": "65f1a9c2d4a1234567890102",
//         "amount": 200,
//         "type": "debit",
//         "source": "refund",
//         "status": "pending",
//         "referenceId": "65f1a9c2d4a1234567890013",
//         "note": "Refund to customer"
//     }
// ];
//
// const addpayment = async (payments)=>{
//     await Payment.insertMany(payments);
//     console.log("payments inserted");
// }
// addpayment(payments);
