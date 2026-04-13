import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
let isConnected = false;

async function connectDB(){
    if (isConnected) {
        return;
    }
    try {
        console.log(process.env.MONGO_URL);
        const db = await mongoose.connect(process.env.MONGO_URL);
        isConnected = db.connections[0].readyState;
        console.log(`Connected to MongoDB! Host: ${db.connection.host}`);
    } catch (err) {
        console.log("Mongoose Connection error", err);
        //process.exit(1);
    }
}

export default connectDB;
