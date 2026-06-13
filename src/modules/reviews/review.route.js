import express from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { authorize } from "../../core/middleware/roleMiddleware.js";
import * as reviewController from "./review.controller.js";
import {
  validate,
  createReviewSchema,
  updateReviewSchema,
  reportCommentSchema,
} from "./review.validation.js";

const router = express.Router();

//  Public 
router.get("/workers/:workerId", reviewController.getWorkerReviews);

//  Protected 
router.use(protect);

// User: Create / Update / Delete review
router.post("/",          validate(createReviewSchema), reviewController.createReview);
router.patch("/:id",       validate(updateReviewSchema), reviewController.updateReview);
router.delete("/:id",                                    reviewController.deleteReview);

// Report comment (user OR worker)
router.post("/report",    validate(reportCommentSchema), reviewController.reportComment);

//  Worker — My profile reviews + hide/unhide 
const workerRouter = express.Router();
workerRouter.use(protect, authorize("worker"));

workerRouter.get("/my-reviews",        reviewController.getMyProfileReviews);
workerRouter.patch("/:id/hide",        reviewController.hideComment);
workerRouter.patch("/:id/unhide",      reviewController.unhideComment);

router.use("/worker", workerRouter);

export default router;
