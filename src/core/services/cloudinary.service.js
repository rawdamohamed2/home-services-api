import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const FOLDER_NAME = "payment-receipts";

/**
 * رفع صورة من Buffer إلى Cloudinary
 * @param {Buffer} buffer - محتوى الصورة
 * @param {string} paymentId - معرف الدفع
 * @returns {Promise<string>} - رابط الصورة
 */
export const uploadReceiptToCloudinary = async (buffer, paymentId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER_NAME,
        public_id: `receipt_${paymentId}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(new Error("Failed to upload receipt"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};