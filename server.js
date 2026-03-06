import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import connectDB from "./src/core/config/db.js";


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (err) {
        console.log("Database connection error:", err.message);
    }
};

startServer();

