import * as subscriptionService from "./subscription.service.js";
import ApiResponse from "../../core/utils/ApiResponse.js";

//  USER — Plans

export const getAllPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    return ApiResponse.success(res, plans);
  } catch (error) { next(error); }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await subscriptionService.getPlanById(req.params.id);
    return ApiResponse.success(res, plan);
  } catch (error) { next(error); }
};

//  USER — My Subscriptions

export const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getMySubscriptions(req.user._id);
    return ApiResponse.success(res, subscriptions);
  } catch (error) { next(error); }
};

export const getMySubscriptionById = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getMySubscriptionById(
      req.user._id,
      req.params.id
    );
    return ApiResponse.success(res, subscription);
  } catch (error) { next(error); }
};

//  USER — Subscribe / Cancel / Renew

export const subscribe = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.subscribe(req.user._id, req.body);
    return ApiResponse.success(res, subscription, "Subscribed successfully", 201);
  } catch (error) { next(error); }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(
      req.user._id,
      req.params.id
    );
    return ApiResponse.success(res, subscription, "Subscription cancelled");
  } catch (error) { next(error); }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.renewSubscription(
      req.user._id,
      req.params.id
    );
    return ApiResponse.success(res, subscription, "Subscription renewed successfully");
  } catch (error) { next(error); }
};

//  ADMIN — Plans CRUD

export const adminGetAllPlans = async (req, res, next) => {
  try {
    const data = await subscriptionService.adminGetAllPlans(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const adminGetPlanById = async (req, res, next) => {
  try {
    const plan = await subscriptionService.adminGetPlanById(req.params.id);
    return ApiResponse.success(res, plan);
  } catch (error) { next(error); }
};

export const adminCreatePlan = async (req, res, next) => {
  try {
    const plan = await subscriptionService.adminCreatePlan(req.body);
    return ApiResponse.success(res, plan, "Plan created successfully", 201);
  } catch (error) { next(error); }
};

export const adminUpdatePlan = async (req, res, next) => {
  try {
    const plan = await subscriptionService.adminUpdatePlan(req.params.id, req.body);
    return ApiResponse.success(res, plan, "Plan updated successfully");
  } catch (error) { next(error); }
};

export const adminDeletePlan = async (req, res, next) => {
  try {
    await subscriptionService.adminDeletePlan(req.params.id);
    return ApiResponse.success(res, null, "Plan deleted successfully");
  } catch (error) { next(error); }
};

//  ADMIN — Features

export const adminAddFeature = async (req, res, next) => {
  try {
    const plan = await subscriptionService.adminAddFeature(req.params.id, req.body.feature);
    return ApiResponse.success(res, plan, "Feature added successfully");
  } catch (error) { next(error); }
};

export const adminRemoveFeature = async (req, res, next) => {
  try {
    const plan = await subscriptionService.adminRemoveFeature(
      req.params.id,
      req.params.featureIndex
    );
    return ApiResponse.success(res, plan, "Feature removed successfully");
  } catch (error) { next(error); }
};

//  ADMIN — User Subscriptions

export const adminGetAllSubscriptions = async (req, res, next) => {
  try {
    const data = await subscriptionService.adminGetAllSubscriptions(req.query);
    return ApiResponse.success(res, data);
  } catch (error) { next(error); }
};

export const adminUpdateSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.adminUpdateSubscriptionStatus(
      req.params.id,
      req.body.status
    );
    return ApiResponse.success(res, subscription, "Subscription status updated");
  } catch (error) { next(error); }
};
