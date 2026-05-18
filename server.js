import dotenv from "dotenv";
dotenv.config();
import app, { httpServer } from "./src/app.js";
import connectDB from "./src/core/config/db.js";
import { initSocket } from "./src/socket/socket.js";
import { startCronJobs } from "./src/core/utils/cron.js";
import { initFirebase } from "./src/core/firebase/firebase.js";

const PORT = process.env.PORT || 5000;

const initializeServices = async () => {
  try {
    await connectDB();
    initFirebase();
    initSocket(httpServer);
    startCronJobs();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server fully operational on port ${PORT}`);
    });
  } catch (err) {
    console.error("Initialization error:", err.message);
  }
};

initializeServices();

export default httpServer;
