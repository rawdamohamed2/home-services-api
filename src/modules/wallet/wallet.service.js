import Wallet from "./Wallet.model.js";
import WalletTransaction from "./WalletTransaction.model.js";

export const getWallet = async (userId) => {
  let wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) wallet = await Wallet.createForUser(userId);
  return wallet;
};

export const getTransactions = async (userId, query = {}) => {
  const wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) throw new Error("Wallet not found");

  const { page = 1, limit = 10, type, source } = query;
  const filter = { wallet: wallet._id };
  if (type)   filter.type   = type;
  if (source) filter.source = source;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    WalletTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const getPendingEarnings = async (userId) => {
  const wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) throw new Error("Wallet not found");

  const pendingTransactions = await WalletTransaction.find({
    wallet: wallet._id, status: "pending", type: "credit",
  }).populate("referenceId").sort({ createdAt: -1 });

  return {
    pendingEarnings: wallet.pendingEarnings,
    transactions:    pendingTransactions,
  };
};
