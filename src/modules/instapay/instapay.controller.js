import * as instapayService from "./instapay.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

//  User — Verify Receipt

export const verifyInstapayReceipt = async (req, res, next) => {
  try {
    if (!req.file)
      return ApiResponse.error(res, "Receipt image is required", 400);

    const result = await instapayService.verifyInstapayReceipt(
      req.params.paymentId,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const message = result.isValid
      ? "Receipt verified ✓"
      : "Receipt uploaded — pending admin review";

    return ApiResponse.success(res, result, message);
  } catch (error) { next(error); }
};

//  Admin — InstaPay Payments

export const adminGetInstapayPayments = async (req, res, next) => {
  try {
    const data = await instapayService.getAdminInstapayPayments(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const adminApproveInstapayPayment = async (req, res, next) => {
  try {
    const payment = await instapayService.adminApproveInstapayPayment(req.params.id, req.user._id);
    return ApiResponse.success(res, payment, "InstaPay payment approved");
  } catch (error) { next(error); }
};

export const adminRejectInstapayPayment = async (req, res, next) => {
  try {
    const payment = await instapayService.adminRejectInstapayPayment(
      req.params.id,
      req.user._id,
      req.body.reason
    );
    return ApiResponse.success(res, payment, "InstaPay payment rejected");
  } catch (error) { next(error); }
};
