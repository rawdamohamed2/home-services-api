import Router from "express";
import {validate} from "../../core/middleware/validate.js";
import {createAdmin} from "./admin.controller.js";


const AdminRouter = Router();

AdminRouter.post('/add',createAdmin);



export default AdminRouter;