import * as withdrawalService from "./withdrawal.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

//  Worker — Withdrawal Methods

export const addWorkerCard = async (req, res, next) => {
  try {
    const method = await withdrawalService.addWorkerCardMethod(req.user._id, req.body);
    return ApiResponse.success(res, method, "Card added successfully", 201);
  } catch (error) { next(error); }
};

export const addWorkerInstapay = async (req, res, next) => {
  try {
    const method = await withdrawalService.addWorkerInstapayMethod(req.user._id, req.body);
    return ApiResponse.success(res, method, "InstaPay account added successfully", 201);
  } catch (error) { next(error); }
};

export const getMyWithdrawalMethods = async (req, res, next) => {
  try {
    const methods = await withdrawalService.getWorkerWithdrawalMethods(req.user._id);
    return ApiResponse.success(res, methods);
  } catch (error) { next(error); }
};

export const deleteMyWithdrawalMethod = async (req, res, next) => {
  try {
    await withdrawalService.deleteWorkerWithdrawalMethod(req.user._id, req.params.id);
    return ApiResponse.success(res, null, "Withdrawal method removed");
  } catch (error) { next(error); }
};

//  Worker — Withdraw

export const requestWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.requestWithdrawal(req.user._id, req.body);
    return ApiResponse.success(res, withdrawal, "Withdrawal request submitted", 201);
  } catch (error) { next(error); }
};

export const withdrawAll = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.withdrawAll(req.user._id, req.body.methodId);
    return ApiResponse.success(res, withdrawal, "Withdrawal all balance requested", 201);
  } catch (error) { next(error); }
};

//  Admin — Withdrawals

export const adminGetWithdrawals = async (req, res, next) => {
  try {
    const data = await withdrawalService.getAdminWithdrawals(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const adminApproveWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.approveWithdrawal(req.params.id, req.user._id);
    return ApiResponse.success(res, withdrawal, "Withdrawal approved");
  } catch (error) { next(error); }
};

export const adminRejectWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.rejectWithdrawal(req.params.id, req.user._id, req.body.reason);
    return ApiResponse.success(res, withdrawal, "Withdrawal rejected");
  } catch (error) { next(error); }
};
