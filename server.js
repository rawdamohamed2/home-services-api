import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import connectDB from "./src/core/config/db.js";
import { httpServer } from "./src/app.js";
import { initSocket } from "./src/socket/socket.js";
import { startCronJobs } from "./src/core/utils/cron.js";
import { initFirebase } from "./src/core/firebase/firebase.js";
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    initFirebase();
    initSocket(httpServer);
    startCronJobs();
    httpServer.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (err) {
    console.log("Database connection error:", err.message);
  }
};

startServer();
