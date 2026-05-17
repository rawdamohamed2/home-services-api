import dotenv from "dotenv";
dotenv.config();

import app, { httpServer } from "./src/app.js";
import connectDB from "./src/core/config/db.js";
import { initSocket } from "./src/socket/socket.js";
import { startCronJobs } from "./src/core/utils/cron.js";
import { initFirebase } from "./src/core/firebase/firebase.js";

const initializeServices = async () => {
  try {
    await connectDB();

    initFirebase();

    initSocket(httpServer);

    startCronJobs();

    console.log("🚀 Server initialized");
  } catch (err) {
    console.error("Initialization error:", err);
  }
};

initializeServices();

export default app;
