import { getPaymentHistory } from "./paymentHistory.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const getMyPaymentsHistory = async (req, res, next) => {
  try {
    const history = await getPaymentHistory(req.user._id);
    return ApiResponse.success(res, history);
  } catch (error) {
    next(error);
  }
};