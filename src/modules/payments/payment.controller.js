import * as paymentService from "./payment.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";
import Errorhandler from "../../core/middleware/Errorhandler.js";
import errorHandler from "../../core/middleware/Errorhandler.js";

//  Payment Methods

export const addCard = async (req, res, next) => {
  try {
    const method = await paymentService.addCardMethod(req.user._id, req.body);
    return ApiResponse.success(res, method, "Card added successfully", 201);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const addInstapay = async (req, res, next) => {
  try {
    const method = await paymentService.addInstapayMethod(
      req.user._id,
      req.body,
    );
    return ApiResponse.success(
      res,
      method,
      "InstaPay account added successfully",
      201,
    );
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getMyPaymentMethods = async (req, res, next) => {
  try {
    const methods = await paymentService.getUserPaymentMethods(req.user._id);
    return ApiResponse.success(res, methods);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const deleteMyPaymentMethod = async (req, res, next) => {
  try {
    await paymentService.deletePaymentMethod(req.user._id, req.params.id);
    return ApiResponse.success(res, null, "Payment method removed");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

//  Payment Flow

export const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    const payment = await paymentService.initiatePayment(
      req.user._id,
      bookingId,
      paymentMethod,
    );
    return ApiResponse.success(res, payment, "Payment initiated", 201);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.confirmPayment(
      req.params.paymentId,
      req.user._id,
    );
    return ApiResponse.success(res, payment, "Payment confirmed");
  } catch (error) {
    errorHandler(error, req, res);
  }
};

export const getReceipt = async (req, res, next) => {
  try {
    const receipt = await paymentService.getReceipt(
      req.params.paymentId,
      req.user._id,
    );
    return ApiResponse.success(res, receipt);
  } catch (error) {
    errorHandler(error, req, res);
  }
};
