import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();


async function connectDB(){
    if (mongoose.connection.readyState === 1) {
        return;
    }
    try {
        console.log(process.env.MONGO_URL);
        const db = await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`Connected to MongoDB! Host: ${db.connection.host}`);
    } catch (err) {
        console.log("Mongoose Connection error", err);
        //process.exit(1);
    }
}

export default connectDB;
