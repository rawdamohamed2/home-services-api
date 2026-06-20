import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_M,
  api_key: process.env.CLOUDINARY_API_KEY_M,
  api_secret: process.env.CLOUDINARY_API_SECRET_M,
});

// 2. إعداد الـ Storage بتاع Multer عشان يرمي على Cloudinary علطول
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "servigo_chat_attachments",
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "docx"],
    resource_type: "auto",
  },
});

// 3. كائن الـ upload اللي هنستخدمه كـ Middleware
export const upload = multer({ storage: storage });
