import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  uploadPhoto,
  deletePhoto,
  addFcmToken,
} from "./user.controller.js";
import { protect } from "../../core/middleware/authMiddleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  uploadPhotoSchema,
} from "./user.validation.js";

const userRouter = Router();

userRouter.get("/me", protect, getMyProfile);

userRouter.patch(
  "/me",
  protect,
  validate(updateProfileSchema),
  updateMyProfile,
);

userRouter.patch("/fcm-token", protect, addFcmToken);

userRouter.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);

userRouter.post(
  "/profile-image",
  protect,
  validate(uploadPhotoSchema),
  uploadPhoto,
);

userRouter.delete("/profile-image", protect, deletePhoto);

export default userRouter;
