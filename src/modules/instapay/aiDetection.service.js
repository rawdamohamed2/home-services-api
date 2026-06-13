import FormData from "form-data";
import fetch from "node-fetch";

const AI_DETECTION_URL = process.env.AI_RECEIPT_VERIFICATION_URL;

export const verifyReceiptWithAI = async (imageBuffer, mimetype, originalname) => {
  try {
    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: originalname || "receipt.jpg",
      contentType: mimetype || "image/jpeg",
    });

    const response = await fetch(AI_DETECTION_URL, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    if (!response.ok)
      throw new Error(`AI service responded with status ${response.status}`);

    const data = await response.json();

    const isValid        = data.success === true && data.result?.valid === true;
    const keywordsFound  = data.result?.keywords_found || [];
    const extractedText  = data.result?.text || "";

    const amountMatch   = extractedText.match(/(\d+(?:\.\d{1,2})?)\s*(?:egp|ecr)/i);
    const detectedAmount = amountMatch ? parseFloat(amountMatch[1]) : null;

    return { isValid, keywordsFound, extractedText, detectedAmount, rawResponse: data };
  } catch (error) {
    console.error("AI Detection Error:", error.message);
    return {
      isValid: false, keywordsFound: [], extractedText: "",
      detectedAmount: null, rawResponse: { error: error.message },
    };
  }
};
