import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URL).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log(`Connected to MongoDB!`);
    } catch (e) {
        cached.promise = null;
        console.log("Mongoose Connection error", e);
        throw e;
    }

    return cached.conn;
}


export default connectDB;
