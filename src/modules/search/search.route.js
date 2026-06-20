import { Router } from "express";
import { protect } from "../../core/middleware/authMiddleware.js";
import { globalSearch } from "./search.controller.js";

const searchRouter = Router();

searchRouter.post("/", protect, globalSearch);

export default searchRouter;
