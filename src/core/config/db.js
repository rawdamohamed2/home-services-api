import mongoose from 'mongoose';

async function connectDB(){
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Connected to MongoDB! Host: ${connectionInstance.connection.host}`);
        // console.log(`Database Name: ${connectionInstance.connection.name}`);

    }catch(err) {
        console.log("Mongoose Connection error", err);
        process.exit(1);
    }
}

export default connectDB;
