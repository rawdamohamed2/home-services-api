import Withdrawal from "./Withdrawal.model.js";
import Wallet from "../wallet/Wallet.model.js";
import PaymentMethod from "../payments/paymentMethod.model.js";

//  Worker — Withdrawal Methods

export const addWorkerCardMethod = async (userId, cardData) => {
  const { cardholderName, cardNumber, expiryMonth, expiryYear, securityCode } = cardData;

  if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16)
    throw new Error("Invalid card number");

  const cleanNumber = cardNumber.replace(/\s/g, "");
  const last4Digits = cleanNumber.slice(-4);
  const cardBrand   =
    cleanNumber[0] === "4" ? "Visa" :
    cleanNumber[0] === "5" ? "Mastercard" : "Unknown";

  const existing = await PaymentMethod.findOne({
    owner: userId, ownerType: "worker", type: "card",
    last4Digits, expiryMonth, expiryYear,
  });
  if (existing) throw new Error("This card is already added");

  const isFirst = !(await PaymentMethod.findOne({ owner: userId, ownerType: "worker" }));

  return await PaymentMethod.create({
    owner: userId, ownerType: "worker", type: "card",
    cardholderName, last4Digits, cardBrand,
    expiryMonth, expiryYear,
    cardToken: cleanNumber,
    isDefault: isFirst,
  });
};

export const addWorkerInstapayMethod = async (userId, { instapayId, accountHolderName }) => {
  if (!instapayId) throw new Error("InstaPay ID is required");

  const existing = await PaymentMethod.findOne({
    owner: userId, ownerType: "worker", type: "instapay", instapayId,
  });
  if (existing) throw new Error("This InstaPay account is already added");

  const isFirst = !(await PaymentMethod.findOne({ owner: userId, ownerType: "worker" }));

  return await PaymentMethod.create({
    owner: userId, ownerType: "worker", type: "instapay",
    instapayId, accountHolderName,
    isDefault: isFirst,
  });
};

export const getWorkerWithdrawalMethods = async (userId) => {
  return await PaymentMethod.find({
    owner: userId, ownerType: "worker", isActive: true,
  }).sort({ isDefault: -1, createdAt: -1 });
};

export const deleteWorkerWithdrawalMethod = async (userId, methodId) => {
  const method = await PaymentMethod.findOne({
    _id: methodId, owner: userId, ownerType: "worker",
  });
  if (!method) throw new Error("Withdrawal method not found");

  const wasDefault = method.isDefault;

  await PaymentMethod.findByIdAndDelete(methodId);

  if (wasDefault) {
    const next = await PaymentMethod.findOne({
      owner: userId, ownerType: "worker", isActive: true, _id: { $ne: methodId },
    });
    if (next) { next.isDefault = true; await next.save(); }
  }
};

//  Worker — Withdraw

export const requestWithdrawal = async (userId, { amount, methodId }) => {
  const wallet = await Wallet.findOne({ owner: userId });
  if (!wallet)          throw new Error("Wallet not found");
  if (!wallet.isActive) throw new Error("Wallet is inactive");
  if (!wallet.hasSufficientBalance(amount)) throw new Error("Insufficient balance");

  const method = await PaymentMethod.findOne({
    _id: methodId, owner: userId, ownerType: "worker", isActive: true,
  });
  if (!method) throw new Error("Withdrawal method not found");

  const methodDetails =
    method.type === "card"
      ? { cardholderName: method.cardholderName, last4Digits: method.last4Digits, cardBrand: method.cardBrand }
      : { instapayId: method.instapayId, accountHolderName: method.accountHolderName };

  return await Withdrawal.create({
    worker: userId,
    wallet: wallet._id,
    amount,
    method: method.type === "card" ? "visa" : "instapay",
    methodDetails,
    status: "pending",
  });
};

export const withdrawAll = async (userId, methodId) => {
  const wallet = await Wallet.findOne({ owner: userId });
  if (!wallet)            throw new Error("Wallet not found");
  if (wallet.balance <= 0) throw new Error("No balance to withdraw");
  return await requestWithdrawal(userId, { amount: wallet.balance, methodId });
};

//  Admin — Withdrawals

export const getAdminWithdrawals = async (query = {}) => {
  const { page = 1, limit = 10, status } = query;
  const filter = {};
  if (status) filter.status = status;

  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter)
      .populate("worker", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Withdrawal.countDocuments(filter),
  ]);

  return {
    withdrawals,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const approveWithdrawal = async (withdrawalId, adminId) => {
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) throw new Error("Withdrawal not found");
  return await withdrawal.approve(adminId);
};

export const rejectWithdrawal = async (withdrawalId, adminId, reason) => {
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) throw new Error("Withdrawal not found");
  return await withdrawal.reject(adminId, reason);
};
