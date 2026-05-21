import * as walletService from "./wallet.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

export const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    return ApiResponse.success(res, wallet);
  } catch (error) { next(error); }
};

export const getMyTransactions = async (req, res, next) => {
  try {
    const data = await walletService.getTransactions(req.user._id, req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const getPendingEarnings = async (req, res, next) => {
  try {
    const data = await walletService.getPendingEarnings(req.user._id);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};
