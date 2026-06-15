import SubscriptionPlan from "./SubscriptionPlan.model.js";
import UserSubscription from "./UserSubscription.model.js";
import PaymentMethod from "../payments/paymentMethod.model.js";
import {
  notifySubscriptionStarted,
  notifySubscriptionCancelled,
  notifySubscriptionRenewed,
} from "../notifications/Notification.service.js";

//  USER — Plans

export const getAllPlans = async () => {
  return await SubscriptionPlan.find({ isActive: true }).sort({
    isPremium: 1,
    finalPrice: 1,
  });
};

export const getPlanById = async (planId) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");
  if (!plan.isActive) throw new Error("Plan is not available");
  return plan;
};

//  USER — My Subscriptions

export const getMySubscriptions = async (userId) => {
  const subscriptions = await UserSubscription.find({ user: userId })
    .populate(
      "plan",
      "name description price discount finalPrice image isPremium features",
    )
    .sort({ createdAt: -1 });

  for (const sub of subscriptions) {
    await sub.checkExpiry();
  }

  return subscriptions;
};

export const getMySubscriptionById = async (userId, subscriptionId) => {
  const subscription = await UserSubscription.findOne({
    _id: subscriptionId,
    user: userId,
  }).populate("plan");

  if (!subscription) throw new Error("Subscription not found");
  await subscription.checkExpiry();
  return subscription;
};

//  USER — Subscribe

export const subscribe = async (userId, { planId, paymentMethodId }) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");
  if (!plan.isActive) throw new Error("Plan is not available");

  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    owner: userId,
    ownerType: "user",
    isActive: true,
  });
  if (!paymentMethod) throw new Error("Payment method not found");

  const existingActive = await UserSubscription.findOne({
    user: userId,
    plan: planId,
    status: "active",
  });
  if (existingActive)
    throw new Error("You already have an active subscription for this plan");

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const transactionId =
    "SUB" +
    Date.now().toString() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const subscription = await UserSubscription.create({
    user: userId,
    plan: planId,
    paymentMethod: paymentMethodId,
    paymentType: paymentMethod.type,
    amountPaid: plan.finalPrice,
    startDate,
    endDate,
    status: "active",
    transactionId,
  });

  notifySubscriptionStarted(
    userId,
    {
      subscriptionId: subscription._id.toString(),
      planId: subscription.plan.toString(),
    },
    { planName: plan.name },
  ).catch((err) =>
    console.error("Failed to send subscription started notification:", err),
  );

  return await subscription.populate(
    "plan",
    "name description price discount finalPrice features",
  );
};

//  USER — Cancel

export const cancelSubscription = async (userId, subscriptionId) => {
  const subscription = await UserSubscription.findOne({
    _id: subscriptionId,
    user: userId,
  }).populate("plan", "name ");

  if (!subscription) throw new Error("Subscription not found");
  if (!subscription.canCancel()) throw new Error("Subscription is not active");

  const planName = subscription.plan.name;
  const planId = subscription.plan._id;

  await UserSubscription.findByIdAndDelete(subscriptionId);

  notifySubscriptionCancelled(
    userId,
    { subscriptionId: subscriptionId.toString(), planId: planId.toString() },
    { planName: planName },
  ).catch((err) =>
    console.error("Failed to send subscription cancelled notification:", err),
  );

  return {
    message: "Subscription cancelled successfully",
    deletedId: subscriptionId,
  };
};

//  USER — Renew

export const renewSubscription = async (userId, subscriptionId) => {
  const subscription = await UserSubscription.findOne({
    _id: subscriptionId,
    user: userId,
  }).populate("plan");

  if (!subscription) throw new Error("Subscription not found");
  if (!subscription.canRenew())
    throw new Error("Subscription cannot be renewed — it is still active");

  const plan = subscription.plan;
  if (!plan.isActive) throw new Error("This plan is no longer available");

  const paymentMethod = await PaymentMethod.findOne({
    _id: subscription.paymentMethod,
    owner: userId,
    isActive: true,
  });
  if (!paymentMethod)
    throw new Error(
      "Original payment method not found. Please subscribe again.",
    );

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const transactionId =
    "SUB" +
    Date.now().toString() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  subscription.status = "active";
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  subscription.cancelledAt = null;
  subscription.cancellationReason = null;
  subscription.renewalCount += 1;
  subscription.amountPaid = plan.finalPrice;
  subscription.transactionId = transactionId;
  await subscription.save();

  notifySubscriptionRenewed(
    userId,
    {
      subscriptionId: subscription._id.toString(),
      planId: plan._id.toString(),
    },
    { planName: plan.name },
  ).catch((err) =>
    console.error("Failed to send subscription renewed notification:", err),
  );

  return subscription;
};

//  ADMIN — Plans CRUD

export const adminGetAllPlans = async (query = {}) => {
  const { page = 1, limit = 10, search, status } = query;
  const filter = {};

  if (search) filter.name = { $regex: search, $options: "i" };
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  const [plans, total] = await Promise.all([
    SubscriptionPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    SubscriptionPlan.countDocuments(filter),
  ]);

  return {
    plans,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  };
};

export const adminGetPlanByName = async (planName) => {
  const plan = await SubscriptionPlan.findOne({
    name: { $regex: new RegExp(`^${planName}$`, "i") },
  });
  if (!plan) throw new Error("Plan not found");
  return plan;
};

export const adminCreatePlan = async (planData) => {
  return await SubscriptionPlan.create(planData);
};

export const adminUpdatePlan = async (planId, updateData) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  Object.assign(plan, updateData);
  await plan.save();

  return plan;
};

export const adminDeletePlan = async (planId) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const activeCount = await UserSubscription.countDocuments({
    plan: planId,
    status: "active",
  });
  if (activeCount > 0)
    throw new Error(
      `Cannot delete — ${activeCount} active subscription(s) exist`,
    );

  await plan.deleteOne();
};

//  ADMIN — Features

export const adminAddFeature = async (planId, feature) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  plan.features.push(feature.trim());
  await plan.save();
  return plan;
};

export const adminRemoveFeature = async (planId, featureIndex) => {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const index = Number(featureIndex);
  if (index < 0 || index >= plan.features.length)
    throw new Error("Feature index out of range");

  plan.features.splice(index, 1);
  await plan.save();
  return plan;
};

export const processExpiringSubscriptions = async () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);

  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const expiringSubs = await UserSubscription.find({
    status: "active",
    endDate: { $gte: startOfDay, $lte: endOfDay },
  }).populate("plan", "name");

  let count = 0;
  for (const sub of expiringSubs) {
    await notifySubscriptionExpiring(
      sub.user,
      { subscriptionId: sub._id.toString(), planId: sub.plan._id.toString() },
      { planName: sub.plan.name, daysLeft: 3 },
    ).catch((err) =>
      console.error("Failed to send expiring notification:", err),
    );
    count++;
  }

  return count;
};

export const processExpiredSubscriptions = async () => {
  const now = new Date();

  const expiredSubs = await UserSubscription.find({
    status: "active",
    endDate: { $lt: now },
  }).populate("plan", "name");

  let count = 0;
  for (const sub of expiredSubs) {
    sub.status = "expired";
    await sub.save();

    await notifySubscriptionExpired(
      sub.user,
      { subscriptionId: sub._id.toString(), planId: sub.plan._id.toString() },
      { planName: sub.plan.name },
    ).catch((err) =>
      console.error("Failed to send expired notification:", err),
    );
    count++;
  }

  return count;
};
