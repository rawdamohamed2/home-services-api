import dotenv from "dotenv";
dotenv.config();
import app, { httpServer } from "./src/app.js"; // تأكدي من صحة مسار ملف app.js
import connectDB from "./src/core/config/db.js";
import { initSocket } from "./src/socket/socket.js";
import { startCronJobs } from "./src/core/utils/cron.js";
import { initFirebase } from "./src/core/firebase/firebase.js";

const PORT = process.env.PORT || 5000;

// دالة تهيئة الخدمات الأساسية
const initializeServices = async () => {
  try {
    await connectDB();
    initFirebase();
    initSocket(httpServer);
  } catch (err) {
    console.error("Initialization error:", err.message);
  }
};

// تشغيل الخدمات فوراً عند قيام السيرفر بقراءة الملف
initializeServices();

// 💡 الشرط السحري: تشغيل الـ listen والـ cron فقط محلياً (Local Development)
if (process.env.NODE_ENV !== "production") {
  startCronJobs();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Local Server started on port ${PORT}`);
  });
}

// تصدير كائن السيرفر ليتولى Vercel تشغيله بأسلوبه السحابي النظيف
export default httpServer;
